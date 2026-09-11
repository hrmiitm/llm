# Computer System Design (CSD)

- [PYQ 1 with step-by-step solutions](CSD-PYQ-1.md) · [original PDF](csd-pyq-1.pdf)
- [PYQ 2 with step-by-step solutions](CSD-PYQ-2.md) · [original PDF](csd-pyq-2.pdf)

Both papers appear in the portal's **Computer System Design** section and are available in exam, practice, and custom-test modes. Each retains 21 original entries (including the zero-mark subject confirmation) and 50 marks. Original question and option IDs are preserved. The PDF creation timestamp is not treated as an exam date. No exam duration is supplied; the portal's 63-minute default is a practice setting.

All 27 PDF pages were reviewed as rendered images alongside text extraction. Circuit, truth-table option, and waveform images are extracted from the original PDFs without colored keys. Text embedded as images has also been transcribed. Binary answers retain their required bit widths and hexadecimal answers retain the `0x` prefix; CSD uses exact, case-insensitive, whitespace-trimmed grading in both exam and practice modes.

## Key corrections and ambiguities

- Both Q5: the conventional reverse routing device is a demultiplexer; use False, with the decoder/enable nuance explained.
- Both Q8: no listed gate pair realizes the **printed** target with the **pictured** inverter and connections. The solutions supply counterexamples for every offered pair.
- Paper 1 Q14 / paper 2 Q16: the first overbar spans the entire product xyz. No offered truth table matches that expression.
- Both Q19: none of the offered waveforms matches positive-edge sampling of the drawn inputs and the initial cleared state. Solutions enumerate all six rising edges.
- Paper 2 Q7: 180 - 50 = 130, whose eight-bit unsigned pattern is `10000010`; a positive signed two's-complement result needs nine bits. The printed `01100010` is incorrect.
- Paper 2 Q21: the printed **6 seconds** conflicts with the nanosecond timeline. The likely intended **6 ns** gives the printed key 0; literal 6 seconds would give 1. Both interpretations are worked; grading follows the intended nanosecond interpretation.
- Both Q4: retain the intended signed interpretation of 1010 as -6, and distinguish it from applying the complement operation, which yields +6.
- MOV questions: explicitly explain the assumed left-to-right, MSB-first filling of the unsubscripted r/d placeholders.

## Source-page and answer audit

A-D/E denote the original option order. Pages are one-based; a continued option may be on the next page. The solution for each question preserves the printed key independently of the portal answer.

| Paper | Original question | PDF start page | Printed key | Portal answer |
| --- | --- | --- | --- | --- |
| 1 | 1 | 1 | `A` | `A` |
| 1 | 2 | 2 | `A` | `A` |
| 1 | 3 | 2 | `B` | `B` |
| 1 | 4 | 2 | `A` | `A` |
| 1 | 5 | 2 | `A` | `B` |
| 1 | 6 | 3 | `B` | `B` |
| 1 | 7 | 3 | `8` | `8` |
| 1 | 8 | 4 | `B` | `E` |
| 1 | 9 | 5 | `1` | `1` |
| 1 | 10 | 5 | `3` | `3` |
| 1 | 11 | 6 | `111` | `111` |
| 1 | 12 | 6 | `32` | `32` |
| 1 | 13 | 7 | `10111010` | `10111010` |
| 1 | 14 | 8 | `C` | `B` |
| 1 | 15 | 9 | `0x18` | `0x18` |
| 1 | 16 | 10 | `22` | `22` |
| 1 | 17 | 10 | `0x2F46` | `0x2F46` |
| 1 | 18 | 11 | `1` | `1` |
| 1 | 19 | 12 | `C` | `E` |
| 1 | 20 | 14 | `1111` | `1111` |
| 1 | 21 | 14 | `4` | `4` |
| 2 | 1 | 1 | `A` | `A` |
| 2 | 2 | 2 | `A` | `A` |
| 2 | 3 | 2 | `B` | `B` |
| 2 | 4 | 2 | `A` | `A` |
| 2 | 5 | 2 | `A` | `B` |
| 2 | 6 | 3 | `B` | `B` |
| 2 | 7 | 3 | `01100010` | `10000010` |
| 2 | 8 | 4 | `D` | `E` |
| 2 | 9 | 4 | `7` | `7` |
| 2 | 10 | 5 | `5` | `5` |
| 2 | 11 | 5 | `3` | `3` |
| 2 | 12 | 6 | `101` | `101` |
| 2 | 13 | 6 | `16` | `16` |
| 2 | 14 | 7 | `0x06` | `0x06` |
| 2 | 15 | 8 | `1111` | `1111` |
| 2 | 16 | 9 | `C` | `B` |
| 2 | 17 | 10 | `18` | `18` |
| 2 | 18 | 11 | `0x2EB3` | `0x2EB3` |
| 2 | 19 | 12 | `C` | `E` |
| 2 | 20 | 13 | `4` | `4` |
| 2 | 21 | 13 | `0` | `0` |

## Verification

- Text extraction plus visual inspection of all 14 pages of paper 1 and all 13 pages of paper 2.
- Compiled packs: 21 entries and 50 marks each; original option counts/order and IDs retained; every entry has a solution and a separately recorded source key.
- Eight automated content, truth-table, sequential-circuit, and scoring checks pass. Run from `portal/` with Node 24: `node --test scripts/tests/csd-content.test.mjs` after `npm run compile`.
- All 42 questions and expanded solutions exercised through the actual portal renderer at 1440 px and 390 px (84 checks): no KaTeX errors, raw dollar math, broken images, overflowing options, or horizontal page overflow.
- Binary/hex rejection and acceptance exercised in the practice UI at both widths with light and dark OS color-scheme preferences. The portal currently retains its existing light content theme under both preferences; this is not a separate dark-theme implementation.
- Production `/llm/` smoke check passes for both catalog cards, both exam routes, and all 22 extracted visual assets.
- `npm run build` passes with the existing large-bundle warning. `npm run lint` completes with five existing warnings in `ExamPage.tsx`; it is not warning-free.
- GitHub Markdown previews for both pushed files were checked on the `main` revision: all 21 solution `<details>` blocks are present, math is rendered without raw dollar delimiters, and every referenced image loads.
- The live GitHub Pages smoke check at `https://hrmiitm.github.io/llm/` also finds both CSD catalog cards and both practice routes; the deployed Paper 2 pack has 21 questions, 50 marks, and Q21 answer `0`.
