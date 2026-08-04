(function (global) {
  'use strict';

  const UNIT_FAMILIES = {
    length: {
      label: 'Length',
      units: [
        { symbol: 'km', scale: 1e3 },
        { symbol: 'm', scale: 1 },
        { symbol: 'cm', scale: 1e-2 },
        { symbol: 'mm', scale: 1e-3 },
        { symbol: 'μm', scale: 1e-6 }
      ]
    },
    mass: {
      label: 'Mass',
      units: [
        { symbol: 'kg', scale: 1e3 },
        { symbol: 'g', scale: 1 },
        { symbol: 'mg', scale: 1e-3 },
        { symbol: 'μg', scale: 1e-6 }
      ]
    },
    volume: {
      label: 'Volume',
      units: [
        { symbol: 'kL', scale: 1e3 },
        { symbol: 'L', scale: 1 },
        { symbol: 'mL', scale: 1e-3 },
        { symbol: 'μL', scale: 1e-6 }
      ]
    }
  };

  const VALUE_GENERATORS = [
    () => randomItem([2, 3, 4, 5, 8, 12, 15, 20, 25, 40, 50, 75, 120, 250, 450, 800]),
    () => randomItem([0.002, 0.005, 0.008, 0.012, 0.025, 0.04, 0.075, 0.12, 0.25, 0.45, 0.8]),
    () => randomItem([1.2, 1.5, 2.5, 4.5, 7.5, 12.5, 25.5, 40.5]),
    () => randomItem([1000, 2500, 5000, 12000, 25000, 75000]),
    () => randomItem([1e-6, 5e-6, 2.5e-5, 4e-4, 7.5e-3]),
    () => randomItem([1e4, 2.5e5, 4e6, 7.5e7])
  ];

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function nearlyEqual(a, b, relativeTolerance) {
    const tolerance = relativeTolerance || 1e-9;
    const scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= tolerance * scale;
  }

  function cleanNumber(value) {
    if (Object.is(value, -0)) return 0;
    return Number(Number(value).toPrecision(12));
  }

  function formatNumber(value) {
    const number = cleanNumber(value);
    const magnitude = Math.abs(number);
    if (number !== 0 && (magnitude >= 1e7 || magnitude < 1e-4)) {
      return number.toExponential(4).replace(/\.0+e/, 'e').replace(/(\.\d*?)0+e/, '$1e');
    }
    return String(number);
  }

  function factorFor(fromUnit, toUnit) {
    const ratio = cleanNumber(fromUnit.scale / toUnit.scale);
    if (ratio >= 1) {
      return {
        numeratorValue: ratio,
        numeratorUnit: toUnit.symbol,
        denominatorValue: 1,
        denominatorUnit: fromUnit.symbol,
        multiplier: ratio
      };
    }
    return {
      numeratorValue: 1,
      numeratorUnit: toUnit.symbol,
      denominatorValue: cleanNumber(1 / ratio),
      denominatorUnit: fromUnit.symbol,
      multiplier: ratio
    };
  }

  function chooseStepCount(family, sourceIndex, targetIndex) {
    const directDistance = Math.abs(sourceIndex - targetIndex);
    const maximum = Math.min(4, family.units.length - 1);
    const possibilities = [];
    for (let steps = 1; steps <= maximum; steps += 1) possibilities.push(steps);
    if (directDistance >= 1 && Math.random() < 0.45) return directDistance;
    return randomItem(possibilities);
  }

  function buildPath(family, source, target, requestedSteps) {
    const candidates = family.units.filter(unit => unit.symbol !== source.symbol && unit.symbol !== target.symbol);
    const intermediateCount = Math.max(0, Math.min(requestedSteps - 1, candidates.length));
    const intermediates = shuffle(candidates).slice(0, intermediateCount);
    const descending = source.scale > target.scale;
    intermediates.sort((a, b) => descending ? b.scale - a.scale : a.scale - b.scale);

    const path = [source];
    intermediates.forEach(unit => {
      const previous = path[path.length - 1];
      if (unit.symbol !== previous.symbol) path.push(unit);
    });
    path.push(target);
    return path;
  }

  function chooseStartValue() {
    return cleanNumber(randomItem(VALUE_GENERATORS)());
  }

  function generateQuestion() {
    const familyKey = randomItem(Object.keys(UNIT_FAMILIES));
    const family = UNIT_FAMILIES[familyKey];
    const source = randomItem(family.units);
    const target = randomItem(family.units.filter(unit => unit.symbol !== source.symbol));
    const sourceIndex = family.units.findIndex(unit => unit.symbol === source.symbol);
    const targetIndex = family.units.findIndex(unit => unit.symbol === target.symbol);
    const requestedSteps = chooseStepCount(family, sourceIndex, targetIndex);
    const path = buildPath(family, source, target, requestedSteps);
    const factors = [];

    for (let index = 0; index < path.length - 1; index += 1) {
      factors.push(factorFor(path[index], path[index + 1]));
    }

    const startValue = chooseStartValue();
    const exactAnswer = cleanNumber(startValue * source.scale / target.scale);

    return {
      familyKey,
      familyLabel: family.label,
      source,
      target,
      startValue,
      factors,
      path,
      exactAnswer,
      finalUnit: target.symbol,
      stepCount: factors.length
    };
  }

  function normalizeUnitInput(value) {
    return String(value || '')
      .trim()
      .replace(/u(?=[mLg])/g, 'μ')
      .replace(/µ/g, 'μ');
  }

  function parseStudentNumber(value) {
    const normalized = String(value || '')
      .trim()
      .replace(/,/g, '')
      .replace(/[×x]\s*10\s*\^?\s*/i, 'e')
      .replace(/\s+/g, '');
    if (!normalized) return NaN;
    return Number(normalized);
  }

  function diagnoseNumber(studentValue, question) {
    if (!Number.isFinite(studentValue)) {
      return 'Enter a numerical value. Scientific notation such as 1.5e6 is accepted.';
    }

    const correct = question.exactAnswer;
    if (nearlyEqual(studentValue, correct)) return '';

    if (studentValue !== 0 && correct !== 0) {
      const ratio = Math.abs(studentValue / correct);
      const logRatio = Math.log10(ratio);
      const nearestPower = Math.round(logRatio);

      if (Math.abs(logRatio - nearestPower) < 1e-8) {
        if (Math.abs(nearestPower) === 3) {
          return 'You appear to be off by one metric prefix. Check the direction you moved the decimal.';
        }
        if (Math.abs(nearestPower) === 1) {
          return 'Check the direction you moved the decimal and the power of ten in each factor.';
        }

        const cumulative = [];
        let running = question.startValue;
        question.factors.forEach(factor => {
          running = cleanNumber(running * factor.multiplier);
          cumulative.push(running);
        });
        if (cumulative.slice(0, -1).some(value => nearlyEqual(studentValue, value))) {
          return 'It looks like you forgot to complete one conversion step.';
        }
      }
    }

    return 'Check your arithmetic. Multiply by each numerator and divide by each denominator.';
  }

  function evaluateAnswer(numberInput, unitInput, question) {
    const studentValue = parseStudentNumber(numberInput);
    const studentUnit = normalizeUnitInput(unitInput);
    const numberCorrect = Number.isFinite(studentValue) && nearlyEqual(studentValue, question.exactAnswer);
    const unitCorrect = studentUnit === question.finalUnit;

    if (numberCorrect && unitCorrect) {
      return {
        correct: true,
        numberCorrect: true,
        unitCorrect: true,
        message: `Calculation authorized. ${formatNumber(question.exactAnswer)} ${question.finalUnit} is correct.`
      };
    }

    if (unitCorrect && !numberCorrect) {
      return {
        correct: false,
        numberCorrect: false,
        unitCorrect: true,
        message: `Your units are correct, but your numerical value needs another look. ${diagnoseNumber(studentValue, question)}`
      };
    }

    if (numberCorrect && !unitCorrect) {
      return {
        correct: false,
        numberCorrect: true,
        unitCorrect: false,
        message: `Your numerical value is correct, but your units need another look. Follow the uncanceled unit at the end of the setup.`
      };
    }

    return {
      correct: false,
      numberCorrect: false,
      unitCorrect: false,
      message: `${diagnoseNumber(studentValue, question)} Then enter the unit that remains after cancellation.`
    };
  }

  global.ConversionEngine = Object.freeze({
    UNIT_FAMILIES,
    generateQuestion,
    evaluateAnswer,
    formatNumber,
    parseStudentNumber,
    normalizeUnitInput
  });
})(window);
