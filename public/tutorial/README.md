# Teaching handout and original figures

`ASIC_Design_Flow_Tutorial.pdf` is the classroom copy of the lecture tutorial. Its public cover replaces the original interview-specific cover; the teaching body, worked examples, numbered practice activities, and references are retained. Its 36-minute route and optional reference sections are suggested teaching material, not evidence of a measured lecture or learning outcome.

The `figures/` directory contains 25 original diagrams as standalone TikZ `.tex` sources, PDF, and PNG exports. You may edit the `.tex` files, compile them with a LaTeX installation containing TikZ, and reuse the diagrams in slides under this project's MIT license. Their sources load `\usetikzlibrary` with the required TikZ libraries.

The introductory HDL simulation uses real synthesized netlists. Timing and physical-design illustrations in the handout and app teach concepts; the application does not generate fabrication-ready layout or perform chip signoff.
