export const COUNTER_SOURCE = `module event_counter (
  input  logic       clk,
  input  logic       rst,
  input  logic       en,
  output logic [3:0] count
);
  always_ff @(posedge clk) begin
    if (rst)
      count <= 4'd0;
    else if (en)
      count <= count + 4'd1;
  end
endmodule`;

export const EXAMPLES = [
  { id: 'counter', name: '4-bit event counter', top: 'event_counter', source: COUNTER_SOURCE,
    goal: 'Count one event on each rising edge when enabled. Reset has priority.' },
  { id: 'step-two', name: 'Counter · increment by 2', top: 'event_counter', source: COUNTER_SOURCE.replace("count + 4'd1", "count + 4'd2"),
    goal: 'Predict which bit stays constant when the counter increments by two.' },
  { id: 'async', name: 'Counter · asynchronous reset', top: 'event_counter', source: COUNTER_SOURCE.replace('@(posedge clk)', '@(posedge clk or posedge rst)'),
    goal: 'Compare the effect of reset between clock edges with the synchronous counter.' },
  { id: 'mux', name: '2-to-1 multiplexer', top: 'mux_demo', source: `module mux_demo (
  input logic a,
  input logic b,
  input logic sel,
  output logic y
);
  assign y = sel ? b : a;
endmodule`, goal: 'Choose which input reaches the output. No clock or stored state is needed.' },
  { id: 'gates', name: 'Combinational gate network', top: 'gate_demo', source: `module gate_demo (
  input logic a,
  input logic b,
  input logic c,
  output logic y
);
  assign y = (a & b) ^ c;
endmodule`, goal: 'Predict the output from an AND gate followed by an XOR gate.' },
] as const;

export const LESSONS = [
  { id: 'intent', short: 'Design intent', label: 'Start with a number that needs memory', subtitle: 'Decide what the circuit must do before deciding how it will be built.', question: 'What should happen when reset and enable are both high?', answer: 'Reset wins. On the next rising edge, the synchronous counter becomes 0, regardless of enable.', figure: '01-flow' },
  { id: 'rtl', short: 'RTL & behavior', label: 'Store, calculate, then update', subtitle: 'RTL means register-transfer level: rules describing stored values and the logic that updates them.', question: 'If enable is low, does the clock still run? Does count change?', answer: 'The clock can still run. The enable controls whether the register accepts a new count; when enable is low, it holds its value.', figure: '03-counter-datapath' },
  { id: 'synthesis', short: 'Gates & mapping', label: 'Compile the rules into components', subtitle: 'Synthesis is the hardware compilation step. A netlist describes the resulting components and connections.', question: 'Does one line of RTL always become one gate?', answer: 'No. A line may infer many gates; optimization may combine, restructure, or remove logic. Technology mapping chooses cells from a target library.', figure: '06-mapping' },
  { id: 'timing', short: 'Timing', label: 'The right value needs to arrive on time', subtitle: 'Setup protects the next update. Hold protects the value just sampled at the current update.', question: 'Will a slower clock fix a hold violation?', answer: 'No. Hold constrains the earliest data arrival after the same launch edge. A hold repair typically adds delay or changes the clock relationship.', figure: '09-timing-path' },
  { id: 'floorplan', short: 'Floorplan & place', label: 'Connected logic needs space', subtitle: 'Move cells and compare wire length. Space and congestion affect implementation.', question: 'Why not pack every cell as tightly as possible?', answer: 'Routing, clock buffers, power distribution, and later fixes need space. High utilization can increase congestion and make timing closure harder.', figure: '14-floorplan' },
  { id: 'clock', short: 'Clock tree', label: 'Distribute one clock to many registers', subtitle: 'The clock is a traveling signal. Its arrival times can differ between registers.', question: 'If the capture clock arrives later, what happens to setup and hold?', answer: 'Positive capture skew helps setup but hurts hold. Clock-tree synthesis seeks useful, controlled arrival times while managing load and slew.', figure: '16-clock-tree' },
  { id: 'routing', short: 'Routing & RC', label: 'Wires become part of the circuit', subtitle: 'Metal layers carry signals. Vias join layers. Resistance and capacitance explain why wires add delay.', question: 'Why can timing pass before routing and fail afterward?', answer: 'Routing introduces wire resistance and capacitance. Extracted interconnect delay can consume the margin estimated earlier in the flow.', figure: '18-parasitics' },
  { id: 'signoff', short: 'Signoff', label: 'A chip needs several kinds of correctness', subtitle: 'Check behavior, timing, geometry, and connectivity before releasing the layout.', question: 'Can a layout pass DRC but still implement the wrong circuit?', answer: 'Yes. DRC checks geometric rules. LVS checks layout connectivity against the reference netlist. Neither replaces functional verification or timing analysis.', figure: '20-drc-lvs' },
] as const;
export type LessonId = typeof LESSONS[number]['id'];
