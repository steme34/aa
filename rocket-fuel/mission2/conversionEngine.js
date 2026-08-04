(function (global) {
  'use strict';

  const UNIT_FAMILIES = {
    length: {
      key: 'length',
      label: 'Length',
      baseUnit: 'm',
      units: [
        { symbol: 'km', name: 'kilometer', plural: 'kilometers', scale: 1e3 },
        { symbol: 'm', name: 'meter', plural: 'meters', scale: 1 },
        { symbol: 'cm', name: 'centimeter', plural: 'centimeters', scale: 1e-2 },
        { symbol: 'mm', name: 'millimeter', plural: 'millimeters', scale: 1e-3 },
        { symbol: 'μm', name: 'micrometer', plural: 'micrometers', scale: 1e-6 }
      ]
    },

    mass: {
      key: 'mass',
      label: 'Mass',
      baseUnit: 'g',
      units: [
        { symbol: 'kg', name: 'kilogram', plural: 'kilograms', scale: 1e3 },
        { symbol: 'g', name: 'gram', plural: 'grams', scale: 1 },
        { symbol: 'mg', name: 'milligram', plural: 'milligrams', scale: 1e-3 },
        { symbol: 'μg', name: 'microgram', plural: 'micrograms', scale: 1e-6 }
      ]
    },

    volume: {
      key: 'volume',
      label: 'Volume',
      baseUnit: 'L',
      units: [
        { symbol: 'kL', name: 'kiloliter', plural: 'kiloliters', scale: 1e3 },
        { symbol: 'L', name: 'liter', plural: 'liters', scale: 1 },
        { symbol: 'mL', name: 'milliliter', plural: 'milliliters', scale: 1e-3 },
        { symbol: 'μL', name: 'microliter', plural: 'microliters', scale: 1e-6 }
      ]
    }
  };

  const SAMPLE_VALUES = [
    2, 4, 5, 8, 10, 12, 15, 20, 25, 40, 50, 75, 100, 120, 200, 250, 400, 450, 500, 750, 800
  ];

  const PATH_LENGTH_WEIGHTS = [
    { steps: 1, weight: 2 },
    { steps: 2, weight: 5 },
    { steps: 3, weight: 3 }
  ];

  let questionCounter = 0;

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomBoolean(probability) {
    return Math.random() < probability;
  }

  function shuffle(items) {
    const copy = items.slice();

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
  }

  function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of items) {
      roll -= item.weight;

      if (roll <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  function nearlyEqual(first, second, tolerance) {
    const allowedDifference = tolerance || 1e-10;
    const scale = Math.max(1, Math.abs(first), Math.abs(second));

    return Math.abs(first - second) <= allowedDifference * scale;
  }

  function normalizeNegativeZero(value) {
    return Object.is(value, -0) ? 0 : value;
  }

  function trimNumber(value) {
    const normalized = normalizeNegativeZero(Number(value));

    if (!Number.isFinite(normalized)) {
      return String(normalized);
    }

    if (normalized === 0) {
      return '0';
    }

    const absoluteValue = Math.abs(normalized);

    if (absoluteValue >= 1e6 || absoluteValue < 1e-4) {
      return normalized
        .toExponential()
        .replace(/\.?0+e/, 'e')
        .replace('e+', ' × 10^')
        .replace('e-', ' × 10^-');
    }

    return Number(normalized.toPrecision(12)).toString();
  }

  function formatPowerOfTen(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return trimNumber(numericValue);
    }

    const exponent = Math.round(Math.log10(numericValue));
    const exactPower = Math.pow(10, exponent);

    if (nearlyEqual(numericValue, exactPower) && Math.abs(exponent) >= 4) {
      return exponent === 0 ? '1' : `10^${exponent}`;
    }

    return trimNumber(numericValue);
  }

  function canonicalNumber(value) {
    return Number(Number(value).toPrecision(12));
  }

  function getFamilyKeys() {
    return Object.keys(UNIT_FAMILIES);
  }

  function getFamily(familyKey) {
    return UNIT_FAMILIES[familyKey] || null;
  }

  function getUnit(familyKey, symbol) {
    const family = getFamily(familyKey);

    if (!family) {
      return null;
    }

    return family.units.find(unit => unit.symbol === symbol) || null;
  }

  function findUnit(symbol) {
    for (const familyKey of getFamilyKeys()) {
      const unit = getUnit(familyKey, symbol);

      if (unit) {
        return {
          familyKey,
          family: UNIT_FAMILIES[familyKey],
          unit
        };
      }
    }

    return null;
  }

  function getUnitIndex(family, unit) {
    return family.units.findIndex(candidate => candidate.symbol === unit.symbol);
  }

  function cloneUnit(unit) {
    return {
      symbol: unit.symbol,
      name: unit.name,
      plural: unit.plural,
      scale: unit.scale
    };
  }

  function createFactorId(
    numeratorValue,
    numeratorUnit,
    denominatorValue,
    denominatorUnit
  ) {
    return [
      canonicalNumber(numeratorValue),
      numeratorUnit,
      canonicalNumber(denominatorValue),
      denominatorUnit
    ].join('|');
  }

  function createFactor(config) {
    const numeratorValue = canonicalNumber(config.numeratorValue);
    const denominatorValue = canonicalNumber(config.denominatorValue);

    return {
      id: createFactorId(
        numeratorValue,
        config.numeratorUnit,
        denominatorValue,
        config.denominatorUnit
      ),
      numeratorValue,
      numeratorUnit: config.numeratorUnit,
      denominatorValue,
      denominatorUnit: config.denominatorUnit,
      fromUnit: config.fromUnit,
      toUnit: config.toUnit,
      role: config.role || 'correct',
      errorType: config.errorType || null,
      reason: config.reason || '',
      equivalentGroup: config.equivalentGroup || null
    };
  }

  function getConversionRatio(fromUnit, toUnit) {
    return fromUnit.scale / toUnit.scale;
  }

  function createWholeNumberFactor(fromUnit, toUnit, role, metadata) {
    const ratio = getConversionRatio(fromUnit, toUnit);
    const details = metadata || {};

    if (ratio >= 1) {
      return createFactor({
        numeratorValue: ratio,
        numeratorUnit: toUnit.symbol,
        denominatorValue: 1,
        denominatorUnit: fromUnit.symbol,
        fromUnit: fromUnit.symbol,
        toUnit: toUnit.symbol,
        role: role || 'correct',
        errorType: details.errorType || null,
        reason: details.reason || '',
        equivalentGroup: details.equivalentGroup || null
      });
    }

    return createFactor({
      numeratorValue: 1,
      numeratorUnit: toUnit.symbol,
      denominatorValue: 1 / ratio,
      denominatorUnit: fromUnit.symbol,
      fromUnit: fromUnit.symbol,
      toUnit: toUnit.symbol,
      role: role || 'correct',
      errorType: details.errorType || null,
      reason: details.reason || '',
      equivalentGroup: details.equivalentGroup || null
    });
  }

  function createDecimalFactor(fromUnit, toUnit, role, metadata) {
    const ratio = getConversionRatio(fromUnit, toUnit);
    const details = metadata || {};

    return createFactor({
      numeratorValue: ratio,
      numeratorUnit: toUnit.symbol,
      denominatorValue: 1,
      denominatorUnit: fromUnit.symbol,
      fromUnit: fromUnit.symbol,
      toUnit: toUnit.symbol,
      role: role || 'correct',
      errorType: details.errorType || null,
      reason: details.reason || '',
      equivalentGroup: details.equivalentGroup || null
    });
  }

  function createEquivalentFactors(fromUnit, toUnit, stepIndex) {
    const equivalentGroup = [
      'step',
      stepIndex,
      fromUnit.symbol,
      toUnit.symbol
    ].join('-');

    const reason = [
      `${fromUnit.symbol} appears in the denominator, so it cancels.`,
      `${toUnit.symbol} remains for the next part of the fuel line.`
    ].join(' ');

    const factors = [
      createWholeNumberFactor(fromUnit, toUnit, 'correct', {
        reason,
        equivalentGroup
      }),
      createDecimalFactor(fromUnit, toUnit, 'correct', {
        reason: `This is an equivalent decimal relationship. ${fromUnit.symbol} cancels and ${toUnit.symbol} remains.`,
        equivalentGroup
      })
    ];

    const uniqueFactors = [];
    const seenIds = new Set();

    factors.forEach(factor => {
      if (!seenIds.has(factor.id)) {
        seenIds.add(factor.id);
        uniqueFactors.push(factor);
      }
    });

    return uniqueFactors;
  }

  function choosePathStepCount(family) {
    const maximumSteps = Math.min(3, family.units.length - 1);

    const eligibleWeights = PATH_LENGTH_WEIGHTS.filter(
      option => option.steps <= maximumSteps
    );

    return weightedRandom(eligibleWeights).steps;
  }

  function createDirectPath(family, source, target) {
    return [source, target];
  }

  function scoreIntermediateUnit(candidate, source, target, family) {
    const sourceIndex = getUnitIndex(family, source);
    const targetIndex = getUnitIndex(family, target);
    const candidateIndex = getUnitIndex(family, candidate);

    const between =
      candidateIndex > Math.min(sourceIndex, targetIndex) &&
      candidateIndex < Math.max(sourceIndex, targetIndex);

    const distanceFromSource = Math.abs(candidateIndex - sourceIndex);
    const distanceFromTarget = Math.abs(candidateIndex - targetIndex);

    let score = 1;

    if (between) {
      score += 6;
    }

    if (candidate.symbol === family.baseUnit) {
      score += 4;
    }

    if (distanceFromSource === 1) {
      score += 2;
    }

    if (distanceFromTarget === 1) {
      score += 2;
    }

    return score;
  }

  function chooseIntermediateUnits(family, source, target, count) {
    const candidates = family.units.filter(
      unit => unit.symbol !== source.symbol && unit.symbol !== target.symbol
    );

    const selected = [];
    const remaining = candidates.slice();

    while (selected.length < count && remaining.length > 0) {
      const weightedCandidates = remaining.map(unit => ({
        unit,
        weight: scoreIntermediateUnit(unit, source, target, family)
      }));

      const selectedCandidate = weightedRandom(weightedCandidates).unit;
      selected.push(selectedCandidate);

      const selectedIndex = remaining.findIndex(
        unit => unit.symbol === selectedCandidate.symbol
      );

      remaining.splice(selectedIndex, 1);
    }

    return selected;
  }

  function orderIntermediateUnits(source, target, intermediateUnits) {
    const movingTowardSmallerUnits = source.scale > target.scale;

    return intermediateUnits.slice().sort((first, second) => {
      if (movingTowardSmallerUnits) {
        return second.scale - first.scale;
      }

      return first.scale - second.scale;
    });
  }

  function buildUnitPath(family, source, target, requestedSteps) {
    const maximumSteps = Math.min(
      requestedSteps,
      family.units.length - 1
    );

    if (maximumSteps <= 1) {
      return createDirectPath(family, source, target);
    }

    const intermediateCount = maximumSteps - 1;
    const intermediateUnits = chooseIntermediateUnits(
      family,
      source,
      target,
      intermediateCount
    );

    const orderedIntermediates = orderIntermediateUnits(
      source,
      target,
      intermediateUnits
    );

    return [source, ...orderedIntermediates, target];
  }

  function makeReversedDistractor(correctFactor, fromUnit, toUnit) {
    return createFactor({
      numeratorValue: correctFactor.denominatorValue,
      numeratorUnit: fromUnit.symbol,
      denominatorValue: correctFactor.numeratorValue,
      denominatorUnit: toUnit.symbol,
      fromUnit: fromUnit.symbol,
      toUnit: toUnit.symbol,
      role: 'distractor',
      errorType: 'reversed',
      reason: [
        `The factor is upside down.`,
        `${fromUnit.symbol} must be in the denominator so the current unit cancels.`
      ].join(' ')
    });
  }

  function makeWrongPowerDistractor(
    correctFactor,
    fromUnit,
    toUnit,
    exponentChange
  ) {
    const multiplier = Math.pow(10, exponentChange);
    let numeratorValue = correctFactor.numeratorValue;
    let denominatorValue = correctFactor.denominatorValue;

    if (numeratorValue !== 1) {
      numeratorValue *= multiplier;
    } else {
      denominatorValue *= multiplier;
    }

    return createFactor({
      numeratorValue,
      numeratorUnit: toUnit.symbol,
      denominatorValue,
      denominatorUnit: fromUnit.symbol,
      fromUnit: fromUnit.symbol,
      toUnit: toUnit.symbol,
      role: 'distractor',
      errorType: 'wrong-power',
      reason: [
        `The units are positioned correctly, but the metric relationship is not.`,
        `Check the power of ten connecting ${fromUnit.symbol} and ${toUnit.symbol}.`
      ].join(' ')
    });
  }

  function makeWrongDenominatorUnitDistractor(
    family,
    fromUnit,
    toUnit,
    excludedSymbols
  ) {
    const alternatives = family.units.filter(
      unit => !excludedSymbols.includes(unit.symbol)
    );

    if (alternatives.length === 0) {
      return null;
    }

    const wrongUnit = randomItem(alternatives);
    const factor = createWholeNumberFactor(wrongUnit, toUnit, 'distractor', {
      errorType: 'wrong-denominator-unit',
      reason: [
        `The denominator contains ${wrongUnit.symbol}.`,
        `The current unit is ${fromUnit.symbol}, so ${fromUnit.symbol} must be in the denominator to cancel.`
      ].join(' ')
    });

    factor.fromUnit = fromUnit.symbol;
    factor.toUnit = toUnit.symbol;

    return factor;
  }

  function makeWrongNumeratorUnitDistractor(
    family,
    fromUnit,
    toUnit,
    excludedSymbols
  ) {
    const alternatives = family.units.filter(
      unit => !excludedSymbols.includes(unit.symbol)
    );

    if (alternatives.length === 0) {
      return null;
    }

    const wrongUnit = randomItem(alternatives);
    const factor = createWholeNumberFactor(fromUnit, wrongUnit, 'distractor', {
      errorType: 'wrong-numerator-unit',
      reason: [
        `${fromUnit.symbol} would cancel, but this factor produces ${wrongUnit.symbol}.`,
        `The next required unit is ${toUnit.symbol}.`
      ].join(' ')
    });

    factor.fromUnit = fromUnit.symbol;
    factor.toUnit = toUnit.symbol;

    return factor;
  }

  function makeCorrectRelationshipWrongOrientationDistractor(
    fromUnit,
    toUnit
  ) {
    const ratio = getConversionRatio(fromUnit, toUnit);

    return createFactor({
      numeratorValue: ratio,
      numeratorUnit: fromUnit.symbol,
      denominatorValue: 1,
      denominatorUnit: toUnit.symbol,
      fromUnit: fromUnit.symbol,
      toUnit: toUnit.symbol,
      role: 'distractor',
      errorType: 'units-not-canceling',
      reason: [
        `This uses the correct metric relationship, but the units do not cancel.`,
        `${fromUnit.symbol} must be placed in the denominator.`
      ].join(' ')
    });
  }

  function buildStepDistractors(
    family,
    fromUnit,
    toUnit,
    correctFactors,
    pathSymbols
  ) {
    const distractors = [];
    const primaryCorrect = correctFactors[0];

    distractors.push(
      makeReversedDistractor(primaryCorrect, fromUnit, toUnit)
    );

    distractors.push(
      makeWrongPowerDistractor(
        primaryCorrect,
        fromUnit,
        toUnit,
        randomBoolean(0.5) ? 1 : -1
      )
    );

    distractors.push(
      makeCorrectRelationshipWrongOrientationDistractor(fromUnit, toUnit)
    );

    const wrongDenominator = makeWrongDenominatorUnitDistractor(
      family,
      fromUnit,
      toUnit,
      [fromUnit.symbol, toUnit.symbol]
    );

    if (wrongDenominator) {
      distractors.push(wrongDenominator);
    }

    const wrongNumerator = makeWrongNumeratorUnitDistractor(
      family,
      fromUnit,
      toUnit,
      [fromUnit.symbol, toUnit.symbol]
    );

    if (wrongNumerator) {
      distractors.push(wrongNumerator);
    }

    const unusedPathUnits = family.units.filter(
      unit =>
        !pathSymbols.includes(unit.symbol) &&
        unit.symbol !== fromUnit.symbol &&
        unit.symbol !== toUnit.symbol
    );

    if (unusedPathUnits.length > 0) {
      const unrelatedUnit = randomItem(unusedPathUnits);
      const unrelatedFactor = createWholeNumberFactor(
        fromUnit,
        unrelatedUnit,
        'distractor',
        {
          errorType: 'wrong-destination',
          reason: [
            `${fromUnit.symbol} cancels, but this sends the fuel line to ${unrelatedUnit.symbol}.`,
            `This slot must connect to ${toUnit.symbol}.`
          ].join(' ')
        }
      );

      unrelatedFactor.fromUnit = fromUnit.symbol;
      unrelatedFactor.toUnit = toUnit.symbol;
      distractors.push(unrelatedFactor);
    }

    const correctIds = new Set(correctFactors.map(factor => factor.id));
    const seenIds = new Set();
    const uniqueDistractors = [];

    distractors.forEach(factor => {
      if (!factor) {
        return;
      }

      if (correctIds.has(factor.id) || seenIds.has(factor.id)) {
        return;
      }

      seenIds.add(factor.id);
      uniqueDistractors.push(factor);
    });

    return uniqueDistractors;
  }

  function createStep(
    family,
    fromUnit,
    toUnit,
    stepIndex,
    totalSteps,
    pathSymbols
  ) {
    const correctFactors = createEquivalentFactors(
      fromUnit,
      toUnit,
      stepIndex
    );

    const distractors = buildStepDistractors(
      family,
      fromUnit,
      toUnit,
      correctFactors,
      pathSymbols
    );

    const displayedCorrectFactor = randomItem(correctFactors);
    const displayedDistractors = shuffle(distractors).slice(0, 3);
    const choices = shuffle([
      displayedCorrectFactor,
      ...displayedDistractors
    ]);

    return {
      id: `step-${stepIndex + 1}`,
      index: stepIndex,
      number: stepIndex + 1,
      totalSteps,
      fromUnit: cloneUnit(fromUnit),
      toUnit: cloneUnit(toUnit),
      instruction: `Cancel ${fromUnit.symbol} and continue in ${toUnit.symbol}.`,
      correctFactors,
      correctIds: correctFactors.map(factor => factor.id),
      choices
    };
  }

  function buildSteps(family, unitPath) {
    const totalSteps = unitPath.length - 1;
    const pathSymbols = unitPath.map(unit => unit.symbol);
    const steps = [];

    for (let index = 0; index < totalSteps; index += 1) {
      steps.push(
        createStep(
          family,
          unitPath[index],
          unitPath[index + 1],
          index,
          totalSteps,
          pathSymbols
        )
      );
    }

    return steps;
  }

  function getQuestionDifficulty(stepCount) {
    if (stepCount <= 1) {
      return {
        key: 'direct',
        label: 'Direct Connection'
      };
    }

    if (stepCount === 2) {
      return {
        key: 'two-step',
        label: 'Two-Part Fuel Line'
      };
    }

    return {
      key: 'three-step',
      label: 'Three-Part Fuel Line'
    };
  }

  function generateQuestion(options) {
    const settings = options || {};
    const availableFamilyKeys = getFamilyKeys();

    const requestedFamilyKey =
      settings.familyKey &&
      availableFamilyKeys.includes(settings.familyKey)
        ? settings.familyKey
        : null;

    const familyKey = requestedFamilyKey || randomItem(availableFamilyKeys);
    const family = UNIT_FAMILIES[familyKey];

    const requestedSource =
      settings.sourceSymbol &&
      getUnit(familyKey, settings.sourceSymbol);

    const source = requestedSource || randomItem(family.units);

    const targetCandidates = family.units.filter(
      unit => unit.symbol !== source.symbol
    );

    const requestedTarget =
      settings.targetSymbol &&
      getUnit(familyKey, settings.targetSymbol);

    const target =
      requestedTarget && requestedTarget.symbol !== source.symbol
        ? requestedTarget
        : randomItem(targetCandidates);

    let requestedSteps = Number(settings.stepCount);

    if (
      !Number.isInteger(requestedSteps) ||
      requestedSteps < 1 ||
      requestedSteps > 3
    ) {
      requestedSteps = choosePathStepCount(family);
    }

    requestedSteps = Math.min(
      requestedSteps,
      family.units.length - 1
    );

    const unitPath = buildUnitPath(
      family,
      source,
      target,
      requestedSteps
    );

    const steps = buildSteps(family, unitPath);
    const includeNumber =
      typeof settings.includeNumber === 'boolean'
        ? settings.includeNumber
        : randomBoolean(0.75);

    const value =
      Number.isFinite(Number(settings.value))
        ? Number(settings.value)
        : randomItem(SAMPLE_VALUES);

    const difficulty = getQuestionDifficulty(steps.length);

    questionCounter += 1;

    return {
      id: `fuel-line-question-${questionCounter}`,
      familyKey,
      familyLabel: family.label,
      source: cloneUnit(source),
      target: cloneUnit(target),
      includeNumber,
      value: includeNumber ? value : null,
      difficulty,
      stepCount: steps.length,
      unitPath: unitPath.map(cloneUnit),
      pathSymbols: unitPath.map(unit => unit.symbol),
      steps,
      prompt: includeNumber
        ? `Convert ${value} ${source.symbol} to ${target.symbol}.`
        : `Build a conversion pathway from ${source.symbol} to ${target.symbol}.`,
      instruction:
        'Assemble the conversion factors in order. Each denominator must cancel the unit immediately before it.',
      completionMessage: [
        `Fuel line assembled correctly.`,
        `${source.symbol} cancels through the pathway, leaving ${target.symbol}.`,
        `No arithmetic is needed.`
      ].join(' ')
    };
  }

  function getStep(question, stepIndex) {
    if (
      !question ||
      !Array.isArray(question.steps) ||
      !Number.isInteger(stepIndex)
    ) {
      return null;
    }

    return question.steps[stepIndex] || null;
  }

  function getChoice(step, choiceOrId) {
    if (!step) {
      return null;
    }

    if (choiceOrId && typeof choiceOrId === 'object') {
      return choiceOrId;
    }

    const choiceId = String(choiceOrId || '');

    const allFactors = [
      ...(step.choices || []),
      ...(step.correctFactors || [])
    ];

    return allFactors.find(factor => factor.id === choiceId) || null;
  }

  function isCorrectChoice(question, stepIndex, choiceOrId) {
    const step = getStep(question, stepIndex);

    if (!step) {
      return false;
    }

    const choice = getChoice(step, choiceOrId);

    if (!choice) {
      return false;
    }

    return step.correctIds.includes(choice.id);
  }

  function evaluateChoice(question, stepIndex, choiceOrId) {
    const step = getStep(question, stepIndex);

    if (!step) {
      return {
        correct: false,
        reason: 'This fuel-line slot does not exist.',
        stepIndex
      };
    }

    const choice = getChoice(step, choiceOrId);

    if (!choice) {
      return {
        correct: false,
        reason: 'That conversion factor is not available for this slot.',
        stepIndex
      };
    }

    const correct = step.correctIds.includes(choice.id);

    if (correct) {
      const isFinalStep = stepIndex === question.steps.length - 1;

      return {
        correct: true,
        choice,
        step,
        stepIndex,
        isFinalStep,
        nextStepIndex: isFinalStep ? null : stepIndex + 1,
        reason: isFinalStep
          ? [
              `${step.fromUnit.symbol} cancels, leaving ${step.toUnit.symbol}.`,
              `The complete fuel line is assembled.`
            ].join(' ')
          : [
              `${step.fromUnit.symbol} cancels correctly.`,
              `The fuel line now continues in ${step.toUnit.symbol}.`
            ].join(' ')
      };
    }

    return {
      correct: false,
      choice,
      step,
      stepIndex,
      isFinalStep: false,
      nextStepIndex: stepIndex,
      errorType: choice.errorType,
      reason:
        choice.reason ||
        `This factor does not correctly connect ${step.fromUnit.symbol} to ${step.toUnit.symbol}.`
    };
  }

  function evaluatePath(question, selectedChoices) {
    if (!question || !Array.isArray(question.steps)) {
      return {
        correct: false,
        completedSteps: 0,
        firstIncorrectStep: 0,
        results: []
      };
    }

    const selections = Array.isArray(selectedChoices)
      ? selectedChoices
      : [];

    const results = [];
    let completedSteps = 0;
    let firstIncorrectStep = null;

    for (let index = 0; index < question.steps.length; index += 1) {
      const selection = selections[index];

      if (!selection) {
        firstIncorrectStep = index;
        break;
      }

      const result = evaluateChoice(question, index, selection);
      results.push(result);

      if (!result.correct) {
        firstIncorrectStep = index;
        break;
      }

      completedSteps += 1;
    }

    const correct =
      completedSteps === question.steps.length &&
      selections.length >= question.steps.length;

    return {
      correct,
      completedSteps,
      totalSteps: question.steps.length,
      firstIncorrectStep,
      results,
      reason: correct
        ? question.completionMessage
        : firstIncorrectStep === null
          ? 'The fuel line is incomplete.'
          : `Check fuel-line slot ${firstIncorrectStep + 1}.`
    };
  }

  function getCancellationState(question, completedStepCount) {
    if (!question || !Array.isArray(question.unitPath)) {
      return {
        currentUnit: null,
        canceledUnits: [],
        remainingUnit: null,
        complete: false
      };
    }

    const safeCompletedCount = Math.max(
      0,
      Math.min(
        Number(completedStepCount) || 0,
        question.steps.length
      )
    );

    const canceledUnits = question.unitPath
      .slice(0, safeCompletedCount)
      .map(unit => unit.symbol);

    const currentUnit =
      question.unitPath[safeCompletedCount] || question.target;

    return {
      currentUnit: currentUnit ? currentUnit.symbol : null,
      canceledUnits,
      remainingUnit:
        safeCompletedCount === question.steps.length
          ? question.target.symbol
          : null,
      complete: safeCompletedCount === question.steps.length
    };
  }

  function formatFactorValue(value) {
    return formatPowerOfTen(value);
  }

  function formatFactor(factor) {
    if (!factor) {
      return '';
    }

    return [
      `${formatFactorValue(factor.numeratorValue)} ${factor.numeratorUnit}`,
      `${formatFactorValue(factor.denominatorValue)} ${factor.denominatorUnit}`
    ].join(' / ');
  }

  function formatUnitPath(questionOrPath) {
    const path = Array.isArray(questionOrPath)
      ? questionOrPath
      : questionOrPath && Array.isArray(questionOrPath.unitPath)
        ? questionOrPath.unitPath
        : [];

    return path
      .map(unit => (typeof unit === 'string' ? unit : unit.symbol))
      .join(' → ');
  }

  function createQuestionFromPath(familyKey, pathSymbols, options) {
    const family = getFamily(familyKey);

    if (!family) {
      throw new Error(`Unknown unit family: ${familyKey}`);
    }

    if (!Array.isArray(pathSymbols) || pathSymbols.length < 2) {
      throw new Error('A fuel-line path requires at least two units.');
    }

    const unitPath = pathSymbols.map(symbol => {
      const unit = getUnit(familyKey, symbol);

      if (!unit) {
        throw new Error(
          `Unit ${symbol} does not belong to the ${family.label} family.`
        );
      }

      return unit;
    });

    const uniqueAdjacentUnits = unitPath.every(
      (unit, index) =>
        index === 0 ||
        unit.symbol !== unitPath[index - 1].symbol
    );

    if (!uniqueAdjacentUnits) {
      throw new Error(
        'Adjacent fuel-line units must be different.'
      );
    }

    const settings = options || {};
    const source = unitPath[0];
    const target = unitPath[unitPath.length - 1];
    const steps = buildSteps(family, unitPath);
    const includeNumber =
      typeof settings.includeNumber === 'boolean'
        ? settings.includeNumber
        : true;

    const value =
      Number.isFinite(Number(settings.value))
        ? Number(settings.value)
        : randomItem(SAMPLE_VALUES);

    questionCounter += 1;

    return {
      id: `fuel-line-question-${questionCounter}`,
      familyKey,
      familyLabel: family.label,
      source: cloneUnit(source),
      target: cloneUnit(target),
      includeNumber,
      value: includeNumber ? value : null,
      difficulty: getQuestionDifficulty(steps.length),
      stepCount: steps.length,
      unitPath: unitPath.map(cloneUnit),
      pathSymbols: unitPath.map(unit => unit.symbol),
      steps,
      prompt: includeNumber
        ? `Convert ${value} ${source.symbol} to ${target.symbol}.`
        : `Build a conversion pathway from ${source.symbol} to ${target.symbol}.`,
      instruction:
        'Assemble the conversion factors in order. Each denominator must cancel the unit immediately before it.',
      completionMessage: [
        `Fuel line assembled correctly.`,
        `${source.symbol} cancels through the pathway, leaving ${target.symbol}.`,
        `No arithmetic is needed.`
      ].join(' ')
    };
  }

  global.ConversionEngine = Object.freeze({
    UNIT_FAMILIES,
    SAMPLE_VALUES: SAMPLE_VALUES.slice(),
    generateQuestion,
    createQuestionFromPath,
    evaluateChoice,
    evaluatePath,
    isCorrectChoice,
    getCancellationState,
    getConversionRatio,
    getFamily,
    getUnit,
    findUnit,
    formatFactorValue,
    formatFactor,
    formatUnitPath,
    shuffle
  });
})(window);
