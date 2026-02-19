# ─────────────────────────────────────────────────────────────
# LaTeXForge — TeX Live Sandbox (scheme-full + science)
# ─────────────────────────────────────────────────────────────
# Full TeX Live image with pre-installed scientific packages.
# Runs with: no network, read-only rootfs, capped resources.
#
# Pre-installed packages (beyond scheme-full):
#   Mathematics:  amsmath, amssymb, mathtools, amsthm, bm
#   Physics:      physics, braket, feynmp, tensor, hepnames
#   Units:        siunitx
#   Chemistry:    mhchem, chemfig, elements, chemmacros
#   Plots:        pgfplots, pgfplotstable, tikz-3dplot
#   Algorithms:   algorithm2e, algorithmicx, listings
#   Tables:       booktabs, multirow, longtable, makecell
#   Typography:   microtype, geometry, fancyhdr, titlesec
#   References:   biblatex, natbib, hyperref, cleveref
#   Fonts:        fontspec, unicode-math, lmodern
#   Code:         minted (requires pygments)
# ─────────────────────────────────────────────────────────────

FROM texlive/texlive:latest

# ── Install scientific and utility packages ───────────────────
# Most are included in scheme-full, but we explicitly ensure
# they're present and up-to-date.
RUN tlmgr update --self && \
    tlmgr install \
    # build tools
    latexmk biber \
    # math
    amsmath amscls mathtools amsthm bm \
    # physics & engineering
    physics braket tensor siunitx \
    # chemistry
    mhchem chemfig elements chemmacros \
    # plots & diagrams
    pgfplots pgfplotstable tikz-3dplot \
    # algorithms & code
    algorithm2e algorithmicx listings minted fvextra \
    # tables
    booktabs multirow longtable makecell tabularray \
    # typography & layout
    microtype geometry fancyhdr titlesec enumitem \
    # bibliography
    biblatex natbib \
    # references
    hyperref cleveref bookmark \
    # fonts
    fontspec unicode-math lmodern cabin inconsolata \
    # utilities
    xcolor graphicx float caption subcaption \
    adjustbox etoolbox xparse iftex standalone \
    # forest for tree diagrams
    forest \
    && rm -rf /usr/local/texlive/*/tlpkg/backups/*

# ── Install Python + Pygments for minted package ─────────────
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends python3-pygments && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ── Create non-root user for compilation ──────────────────────
RUN groupadd -r latex && useradd -r -g latex -d /work latex

# ── Copy compile script ──────────────────────────────────────
COPY compile.sh /usr/local/bin/compile.sh
RUN chmod +x /usr/local/bin/compile.sh

WORKDIR /work
USER latex

ENTRYPOINT ["/usr/local/bin/compile.sh"]
