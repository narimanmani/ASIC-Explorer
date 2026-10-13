# Feature screenshots

Captured on October 12, 2026 from the production app at `http://127.0.0.1:4175`, using the default Codex in-app browser viewport. These are unmodified browser captures. The first nine images capture the full lesson page; the last captures the teaching-notes dialog in the visible viewport. The application source was not changed for these captures.

The main [README gallery](../../README.md#screenshots-and-classroom-walkthrough) embeds every image with a caption and an experiment.

| File | Lesson or feature | Displayed state |
| --- | --- | --- |
| [01-counter-intent.jpg](01-counter-intent.jpg) | Design intent / Guided view | Count 2, binary 0010, three edges, Enable off, Reset off. |
| [02-rtl-word-level.jpg](02-rtl-word-level.jpg) | RTL / Full lab | Prepared counter, count 2 after two enabled edges; selected adder and source association; settled-event waveform. |
| [03-gate-level.jpg](03-gate-level.jpg) | Gates and mapping / Full lab | Same counter, generic gates, count 3 after a third enabled edge. |
| [04-yosys-report.jpg](04-yosys-report.jpg) | Real synthesis report | Fresh synthesis of the unchanged counter using Yosys 0.70.62-dev.1236; 2 word-level and 10 generic mapped cells; simulation reinitialized to zero. |
| [05-timing-slack.jpg](05-timing-slack.jpg) | Timing / Full lab | After routing preset: arrival 1.60 ns, deadline 1.55 ns, setup slack -0.05 ns, hold slack -0.04 ns. |
| [06-cell-placement.jpg](06-cell-placement.jpg) | Floorplan / Full lab | Compact six-cell placement, utilization 60%, connection length 455 teaching units. |
| [07-clock-tree.jpg](07-clock-tree.jpg) | Clock tree / Full lab | Buffered symmetric illustration; four assigned 0.20 ns arrivals; displayed spread 0.00 ns. |
| [08-routing-rc.jpg](08-routing-rc.jpg) | Routing / Full lab | Both metal layers visible; conceptual RC overlay enabled; reset arrangement with 1020-unit connection length. |
| [09-drc-lvs.jpg](09-drc-lvs.jpg) | Signoff / Full lab | Prepared Broken connection case: DRC PASS and LVS FAIL. |
| [10-teaching-notes.jpg](10-teaching-notes.jpg) | Instructor notes | Signoff demonstration cues, planned slide transition, original tutorial diagram, and PDF links. |

Yosys creates the circuit netlists and synthesis log; DigitalJS supplies functional values and waveform samples. The circuit layout is a drawing of the netlist. The timing and physical-design pages are separate illustrative models. The images do not show executed placement, clock-tree synthesis, routing, extraction, DRC, LVS, or chip signoff tools.

To refresh an image, open the stated lesson, reproduce the displayed state through its controls, capture the browser, and replace the corresponding JPEG. Update this date and the main README caption if the interface or result changes.
