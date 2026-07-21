// Replays DECtalk 4.63 Ph_drwt02.c's short-declarative baseline and
// filter_commands() recurrence against a captured DEBUGF0 main-filter trace.

const baseline = [
  1160, 1150, 1140, 1152, 1132, 1140, 1130, 1124, 1110,
  1100, 1080, 1060, 1040, 1020, 980, 960, 950,
];

const observedMain = [
  1159, 1159, 1159, 1158, 1158, 1157, 1157, 1156, 1155, 1154,
  1153, 1152, 1151, 1159, 1174, 1194, 1218, 1244, 1271, 1299,
  1327, 1355, 1381, 1407, 1431, 1454, 1476, 1496, 1515, 1532,
  1548, 1563, 1576, 1582, 1582, 1577, 1569, 1559, 1547, 1534,
  1520, 1505, 1491, 1476, 1462, 1449, 1435, 1423, 1410, 1399,
  1388, 1377, 1367, 1357, 1348, 1339, 1331,
];

const q14 = (left: number, right: number): number => (left * right) >> 14;

function renderMain(tcumdur: number): number[] {
  const coefficient = 2100;
  const complement = 16384 - coefficient;
  let firstPole = baseline[0] << 3;
  let secondPole = baseline[0] << 3;
  let lastbase = baseline[0] << 2;
  let basetime = 0;
  let basecntr = 0;
  let basestep = 0;
  let hat = 0;
  let impulse = 0;
  let impulseDelta = 0;
  let impulseFrames = 0;

  return observedMain.map((_, frame) => {
    if (frame === 13) {
      hat += 190;
      impulse = 191 << 1;
      impulseDelta = 191 >> 2;
      impulseFrames = 20;
    }

    if ((frame << 4) >= basetime) {
      basestep = (lastbase >> 2) - baseline[basecntr + 1];
      basetime += tcumdur;
      if (basecntr <= 14) basecntr += 1;
    }
    lastbase -= Math.trunc((basestep << 6) / tcumdur);
    const baselineTarget = lastbase >> 2;

    impulseFrames -= 1;
    if (impulseFrames < 0) {
      impulse = 0;
      impulseDelta = 0;
      impulseFrames = 0;
    } else {
      impulse -= impulseDelta;
    }

    const input = baselineTarget + hat + impulse;
    firstPole = q14(coefficient << 3, input) + q14(complement, firstPole);
    secondPole = q14(coefficient, firstPole) + q14(complement, secondPole);
    const output = secondPole >> 3;

    if (impulse !== 0) impulse += impulseDelta;
    impulseDelta >>= 1;
    return output;
  });
}

const candidates = Array.from({ length: 300 }, (_, offset) => offset + 1)
  .map((tcumdur) => {
    const rendered = renderMain(tcumdur);
    const errors = rendered.map((value, index) => value - observedMain[index]);
    return {
      exactCells: errors.filter((error) => error === 0).length,
      maxAbs: Math.max(...errors.map(Math.abs)),
      rendered,
      sumAbs: errors.reduce((sum, error) => sum + Math.abs(error), 0),
      tcumdur,
    };
  })
  .sort((left, right) => left.sumAbs - right.sumAbs || left.maxAbs - right.maxAbs);

const observedClock = candidates.find((candidate) => candidate.tcumdur === 78);
if (!observedClock || observedClock.exactCells !== observedMain.length) {
  throw new Error("DECtalk's observed 78-frame controller clock did not reproduce the captured main-filter trace");
}
console.log(JSON.stringify({ best: candidates.slice(0, 5), observedClock }, null, 2));
