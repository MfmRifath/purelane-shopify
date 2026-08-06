# AI workflow

How this build was actually run, where the agent was wrong, and what I would
turn into tooling if I had to do twenty more of these.

---

## What I delegated

**Reading the file.** 1,717 lines, ~148KB, most of it base64 and SVG path data.
The first useful move was not "read it", it was writing a two-line script to
strip the noise so the structural HTML fitted in one pass. Delegating "extract
the four caustic SVGs to files with namespaced ids" as a script beat any amount
of copy-paste.

**Mechanical CSS transposition.** Two stylesheets, one overriding the other,
into one namespaced token set. This is the part agents are genuinely good at:
high volume, low ambiguity, verifiable afterwards. I gave it the resolved
palette explicitly rather than letting it work out which layer wins, because
that's the step where a mistake is silent.

**Schema boilerplate.** Section settings, presets, `index.json`. Repetitive and
easy to check against a rendered theme editor.

**Docs drafting.** Tables, field lists, the setup runbook.

## What I kept

**The data model.** Which things are metaobjects, which are section blocks,
which are product metafields. This is the decision the whole build hangs off
and it needs a view about who edits what and how often — combos change weekly
and belong in Content, bundle tiers change quarterly and belong in the section,
a badge belongs on the product because it follows the product.

**Deciding what is a bug versus a design decision.** The four empty card tiles
and the leaked `.qty` box both look like design at a glance. Working out which
one to fix and which to reproduce is a judgement call about what the file is
*for*, and I would not delegate it. An agent asked to "match the file exactly"
will faithfully reproduce a bug; an agent asked to "clean it up" will quietly
redesign it. Neither is right.

**The verification method.** Deciding to measure bounding boxes rather than
eyeball screenshots was worth more than any single line of code in this build.

---

## Where it broke

**1. The agent believed the CSS instead of the browser.** Reading the file, my
first pass concluded the shop card bottles were sized somewhere. They aren't —
`.card .shot .pimg` has a height in the mobile media query only. I only caught
it by screenshotting the original at 1440px and seeing four empty tiles. **A
model reading CSS reasons about what the author meant. Only a browser knows
what it does.**

**2. It over-improved twice, invisibly.** I had made bundle tier cards a flex
column so buttons bottom-aligned, and added `flex-wrap` to the card price row.
Both are what you'd write if you were designing this. Both change the render:
the price row wrap adds 12px to every card at 375px. Neither is visible in a
diff review — a human reading that CSS would nod along. The measurement pass
caught both. **The failure mode isn't wrong code, it's defensible code that
isn't the spec.**

**3. Confident numbers.** The first draft of the contrast section in the build
notes said "roughly 4.6:1" for `--pl-paper-3`. Computed properly it is 3.8:1 —
which flips the conclusion from "passes for bold text" to "fails AA". Any
number an agent produces without running an arithmetic step is a guess wearing
a suit. Same class of error as the "roughly 40% of the CSS is dead" claim I cut
because I hadn't counted.

**4. Plausible API details.** `metaobject_list` as a section setting type was
asserted before it was checked. It happens to be real. `theme-check` flagging
`{% continue %}` as an undefined object is a false positive that I also had to
verify by hand rather than trust either direction.

---

## The loop that worked

```
strip the input to what matters   → script, not reading
port                              → agent, high volume
render both                       → headless Chromium
measure, don't look               → getBoundingClientRect + computed style
diff the numbers                  → every delta is either a bug or a decision
```

The last line is the important one. Every measured difference gets classified
as *my bug* or *their bug*. Two were mine and got reverted. One is theirs and
is documented as the single intentional 2px difference. Nothing is left as
"close enough".

---

## What I'd systematise for twenty more of these

**1. A prototype triage script.** Every one of these arrives as a single file
built fast. The same first ten minutes every time: strip base64 and SVG paths,
list sections and anchors, list the CSS layers and which one wins, list
selectors with no matching markup, list markup with no matching selector. That
last pair alone found the `#voices` dead anchor and the whole dead PDP block
here.

**2. A parity harness as a committed artifact, not a throwaway.** Point it at
the original file and the dev store preview, give it a selector map, and have
it emit the table that's in the build notes. Baselines in git, run on every PR.
This is the single highest-leverage thing: it makes "pixel accurate" a build
step instead of an opinion, and it's what caught both of my own regressions.

**3. A section skeleton generator.** Every one of these builds needs the same
scaffolding: a section that loads its own CSS, sets padding from settings,
carries `data-pl-scene` and a rail label, renders a shared head snippet, and
degrades to an editor-only empty state. Five sections here shared that shape
exactly. It should be a template, not five acts of typing.

**4. A theme-editor survival checklist, automated.** Add the section twice,
reorder it, delete the one above it, change every setting, add and remove every
block, toggle Reduce motion. Every failure I have seen in this class of work is
in that list. It's a Playwright script against the preview URL, and it is more
valuable than any lint rule because it tests the thing the lint rules can't
see.

**5. A house rule the agent gets in its context, not in a prompt.** *A port is
not an improvement. If you would write it differently, write it the original
way and put the difference in the notes.* Both of my regressions were the agent
being helpful. That instruction costs nothing and would have prevented both.

**6. A metaobject definitions file in the repo.** The definitions in `SETUP.md`
are prose a human retypes into the admin. They should be a JSON file the
Shopify CLI or the Admin API applies, so a fresh dev store is one command away
from being ready. That is the difference between a 30-minute setup and a
30-second one, twenty times over.
