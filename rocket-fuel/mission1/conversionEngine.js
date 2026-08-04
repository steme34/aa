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

  const SAMPLE_VALUES = [2, 5, 8, 12, 25, 40, 75, 120, 250, 450, 800];

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

  function trimNumber(value) {
    if (value === 0) return '0';
    if (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-4) {
      return value.toExponential().replace('e+', ' × 10^').replace('e-', ' × 10^-');
    }
    return Number(value.toPrecision(10)).toString();
  }

  function powerOfTenText(value) {
    const exponent = Math.round(Math.log10(value));
    if (Math.abs(value - Math.pow(10, exponent)) < 1e-12 && Math.abs(exponent) >= 4) {
      return exponent === 0 ? '1' : `10^${exponent}`;
    }
    return trimNumber(value);
  }

  function makeFactor(numeratorValue, numeratorUnit, denominatorValue, denominatorUnit, role, reason) {
    return {
      numeratorValue,
      numeratorUnit,
      denominatorValue,
      denominatorUnit,
      role,
      reason,
      id: `${numeratorValue}|${numeratorUnit}|${denominatorValue}|${denominatorUnit}`
    };
  }

  function createEquivalentFactors(source, target) {
    const sourcePerTarget = target.scale / source.scale;
    const targetPerSource = source.scale / target.scale;

    return [
      makeFactor(
        1,
        target.symbol,
        sourcePerTarget,
        source.symbol,
        'correct',
        `The starting unit ${source.symbol} is in the denominator, so it cancels. The target unit ${target.symbol} remains.`
      ),
      makeFactor(
        targetPerSource,
        target.symbol,
        1,
        source.symbol,
        'correct',
        `This decimal form is equivalent. ${source.symbol} cancels, leaving ${target.symbol}.`
      )
    ];
  }

  function nearbyPower(value, direction) {
    return value * Math.pow(10, direction);
  }

  function buildDistractors(source, target, correctFactors) {
    const correct = correctFactors[0];
    const ratio = correct.denominatorValue;
    const distractors = [];

    distractors.push(makeFactor(
      correct.denominatorValue,
      source.symbol,
      correct.numeratorValue,
      target.symbol,
      'reversed',
      `Remember: the unit you are converting TO belongs in the numerator so it remains after cancellation.`
    ));

    distractors.push(makeFactor(
      1,
      target.symbol,
      nearbyPower(ratio, 1),
      source.symbol,
      'power',
      `The units are arranged correctly, but the power of ten is off. Check the relationship between ${source.symbol} and ${target.symbol}.`
    ));

    distractors.push(makeFactor(
      1,
      target.symbol,
      nearbyPower(ratio, -1),
      source.symbol,
      'power',
      `The units are arranged correctly, but the metric relationship is not. Check how many ${source.symbol} equal 1 ${target.symbol}.`
    ));

    const family = Object.values(UNIT_FAMILIES).find(group => group.units.some(unit => unit.symbol === source.symbol));
    const confusingUnit = family.units
      .filter(unit => unit.symbol !== source.symbol && unit.symbol !== target.symbol)
      .sort((a, b) => Math.abs(Math.log10(a.scale / source.scale)) - Math.abs(Math.log10(b.scale / source.scale)))[0];

    if (confusingUnit) {
      distractors.push(makeFactor(
        1,
        target.symbol,
        target.scale / confusingUnit.scale,
        confusingUnit.symbol,
        'wrong-unit',
        `Check the units carefully. The denominator must contain the starting unit, ${source.symbol}, not ${confusingUnit.symbol}.`
      ));
    }

    const seen = new Set(correctFactors.map(item => item.id));
    return distractors.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function generateQuestion() {
    const familyKey = randomItem(Object.keys(UNIT_FAMILIES));
    const family = UNIT_FAMILIES[familyKey];
    const source = randomItem(family.units);
    let target = randomItem(family.units);
    while (target.symbol === source.symbol) target = randomItem(family.units);

    const correctFactors = createEquivalentFactors(source, target);
    const chosenCorrect = randomItem(correctFactors);
    const distractors = buildDistractors(source, target, correctFactors);
    const choices = shuffle([chosenCorrect, ...shuffle(distractors).slice(0, 3)]);
    const includeNumber = Math.random() < 0.5;

    return {
      familyKey,
      familyLabel: family.label,
      source,
      target,
      includeNumber,
      value: includeNumber ? randomItem(SAMPLE_VALUES) : null,
      choices,
      correctIds: new Set(correctFactors.map(item => item.id))
    };
  }

  function formatFactorValue(value) {
    return powerOfTenText(value);
  }

  global.ConversionEngine = {
    UNIT_FAMILIES,
    generateQuestion,
    formatFactorValue
  };
})(window);
