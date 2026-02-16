/**
 * 10 LaTeX starter templates for the TemplatesGallery.
 */

export interface LatexTemplate {
    id: string;
    name: string;
    description: string;
    category: "academic" | "presentation" | "professional" | "general";
    icon: string;
    content: string;
}

export const LATEX_TEMPLATES: LatexTemplate[] = [
    {
        id: "article",
        name: "Article",
        description: "Standard academic article with abstract, sections, and references.",
        category: "academic",
        icon: "📄",
        content: `\\documentclass[12pt, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{graphicx}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{natbib}

\\title{Your Article Title}
\\author{Author Name \\\\\\\\ Department of Subject \\\\\\\\ University Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This is the abstract of your article. Summarise your key findings here in 150--250 words.
\\end{abstract}

\\section{Introduction}
Start your introduction here. Provide background and motivation for your work.

\\section{Methods}
Describe your methodology here.

\\section{Results}
Present your findings. Use equations like:
\\begin{equation}
  E = mc^2
\\end{equation}

\\section{Discussion}
Discuss the implications of your results.

\\section{Conclusion}
Summarise your key contributions.

\\bibliographystyle{plainnat}
\\bibliography{references}

\\end{document}`,
    },
    {
        id: "beamer",
        name: "Beamer Presentation",
        description: "Professional slide deck with sections and animations.",
        category: "presentation",
        icon: "🎬",
        content: `\\documentclass{beamer}
\\usetheme{Madrid}
\\usecolortheme{seahorse}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{Presentation Title}
\\subtitle{A Subtitle}
\\author{Author Name}
\\institute{University / Organisation}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Outline}
  \\tableofcontents
\\end{frame}

\\section{Introduction}

\\begin{frame}{Introduction}
  \\begin{itemize}
    \\item First point
    \\item Second point
    \\item Third point
  \\end{itemize}
\\end{frame}

\\section{Main Content}

\\begin{frame}{Key Results}
  \\begin{block}{Theorem}
    Here is an important theorem or result.
  \\end{block}

  \\begin{equation}
    f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
  \\end{equation}
\\end{frame}

\\begin{frame}{Figures}
  \\begin{figure}
    \\centering
    % \\includegraphics[width=0.8\\textwidth]{figure.png}
    \\caption{A placeholder for your figure.}
  \\end{figure}
\\end{frame}

\\section{Conclusion}

\\begin{frame}{Summary}
  \\begin{enumerate}
    \\item Key finding one
    \\item Key finding two
    \\item Future work
  \\end{enumerate}
\\end{frame}

\\begin{frame}
  \\centering
  \\Huge Thank You!\\\\[1em]
  \\normalsize Questions?
\\end{frame}

\\end{document}`,
    },
    {
        id: "letter",
        name: "Formal Letter",
        description: "Professional letter layout with sender/recipient addresses.",
        category: "professional",
        icon: "✉️",
        content: `\\documentclass[12pt]{letter}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}

\\signature{Your Name}
\\address{Your Street \\\\ City, State ZIP \\\\ your.email@example.com}

\\begin{document}

\\begin{letter}{Recipient Name \\\\ Company \\\\ Street \\\\ City, State ZIP}

\\opening{Dear Recipient,}

I am writing to you regarding \\ldots

This is the body of the letter. It should be clear, concise, and professional.

\\closing{Yours sincerely,}

\\end{letter}
\\end{document}`,
    },
    {
        id: "cv",
        name: "CV / Résumé",
        description: "Clean, modern curriculum vitae with sections for experience and skills.",
        category: "professional",
        icon: "👤",
        content: `\\documentclass[11pt, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries Your Name}\\\\[4pt]
  City, Country \\quad|\\quad your.email@example.com \\quad|\\quad +1 (555) 123-4567\\\\
  \\href{https://github.com/username}{github.com/username} \\quad|\\quad
  \\href{https://linkedin.com/in/username}{linkedin.com/in/username}
\\end{center}

\\section{Education}
\\textbf{University Name} \\hfill 2020 -- 2024\\\\
BSc Computer Science, First Class Honours

\\section{Experience}
\\textbf{Software Engineer} --- Company Name \\hfill Jun 2024 -- Present
\\begin{itemize}[leftmargin=1.5em, topsep=2pt, itemsep=1pt]
  \\item Developed and maintained microservices processing 10M+ requests/day
  \\item Led migration from monolith to event-driven architecture
\\end{itemize}

\\textbf{Intern} --- Another Company \\hfill Jun 2023 -- Sep 2023
\\begin{itemize}[leftmargin=1.5em, topsep=2pt, itemsep=1pt]
  \\item Built internal dashboard used by 50+ team members
\\end{itemize}

\\section{Skills}
\\textbf{Languages:} Python, TypeScript, Go, SQL\\\\
\\textbf{Frameworks:} React, Next.js, FastAPI, Django\\\\
\\textbf{Tools:} Docker, Kubernetes, PostgreSQL, Redis

\\section{Projects}
\\textbf{Project Name} \\hfill \\href{https://github.com/user/project}{GitHub}
\\begin{itemize}[leftmargin=1.5em, topsep=2pt, itemsep=1pt]
  \\item Brief description of the project and your contributions.
\\end{itemize}

\\end{document}`,
    },
    {
        id: "thesis",
        name: "Book / Thesis",
        description: "Multi-chapter document with table of contents, bibliography, and appendices.",
        category: "academic",
        icon: "📚",
        content: `\\documentclass[12pt, a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath, amssymb}
\\usepackage{graphicx}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{setspace}
\\onehalfspacing

\\title{Thesis Title}
\\author{Author Name \\\\\\\\ Supervisor: Prof.\\ Supervisor Name \\\\\\\\ Department of Subject \\\\\\\\ University Name}
\\date{Month Year}

\\begin{document}

\\maketitle

\\begin{abstract}
A comprehensive abstract of the thesis (250--500 words).
\\end{abstract}

\\tableofcontents
\\listoffigures
\\listoftables

\\chapter{Introduction}
\\section{Background}
Provide context for your research.

\\section{Research Questions}
State your research questions clearly.

\\chapter{Literature Review}
Discuss existing work in your field.

\\chapter{Methodology}
Describe your approach.

\\chapter{Results}
Present your findings.

\\chapter{Discussion}
Analyse and interpret results.

\\chapter{Conclusion}
Summarise contributions and future work.

\\appendix
\\chapter{Additional Data}
Any supplementary material.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}`,
    },
    {
        id: "lab-report",
        name: "Lab Report",
        description: "Scientific lab report with hypothesis, data tables, and analysis.",
        category: "academic",
        icon: "🔬",
        content: `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{siunitx}

\\title{Lab Report: Experiment Title}
\\author{Student Name \\\\\\\\ Lab Partner: Partner Name \\\\\\\\ Course Code --- Section}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Objective}
State the purpose of the experiment clearly.

\\section{Hypothesis}
If [independent variable], then [dependent variable] because [reasoning].

\\section{Materials}
\\begin{itemize}
  \\item Equipment item 1
  \\item Equipment item 2
  \\item Chemicals / reagents
\\end{itemize}

\\section{Procedure}
\\begin{enumerate}
  \\item First step of the procedure.
  \\item Second step of the procedure.
  \\item Measure and record data.
\\end{enumerate}

\\section{Data}
\\begin{table}[h]
\\centering
\\caption{Experimental Results}
\\begin{tabular}{@{}lccc@{}}
\\toprule
Trial & Mass (\\si{g}) & Time (\\si{s}) & Rate (\\si{g/s}) \\\\
\\midrule
1 & 10.2 & 5.1 & 2.00 \\\\
2 & 10.5 & 4.8 & 2.19 \\\\
3 & 10.1 & 5.3 & 1.91 \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Analysis}
Discuss your data, calculate averages, and identify trends.

\\section{Conclusion}
Was your hypothesis supported? Discuss sources of error.

\\end{document}`,
    },
    {
        id: "ieee",
        name: "IEEE Conference Paper",
        description: "Two-column IEEE format for conference submissions.",
        category: "academic",
        icon: "📡",
        content: `\\documentclass[conference]{IEEEtran}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath, amssymb}
\\usepackage{graphicx}
\\usepackage{cite}
\\usepackage{hyperref}

\\title{Your Paper Title Here}
\\author{
  \\IEEEauthorblockN{First Author}
  \\IEEEauthorblockA{Department\\\\University\\\\email@example.com}
  \\and
  \\IEEEauthorblockN{Second Author}
  \\IEEEauthorblockA{Department\\\\University\\\\email@example.com}
}

\\begin{document}
\\maketitle

\\begin{abstract}
This paper presents \\ldots (150 words max for IEEE).
\\end{abstract}

\\begin{IEEEkeywords}
keyword1, keyword2, keyword3
\\end{IEEEkeywords}

\\section{Introduction}
Introduce the problem and your contributions.

\\section{Related Work}
Summarise relevant prior work.

\\section{Proposed Method}
Describe your approach.

\\section{Experiments}

\\subsection{Setup}
Describe experimental configuration.

\\subsection{Results}
Present quantitative results.

\\section{Conclusion}
Summarise findings and future directions.

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}`,
    },
    {
        id: "homework",
        name: "Homework / Problem Set",
        description: "Numbered problem set with solution boxes and math formatting.",
        category: "general",
        icon: "📝",
        content: `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{enumitem}
\\usepackage{mdframed}

\\newcommand{\\problem}[1]{\\section*{Problem #1}}
\\newmdenv[linewidth=1pt, roundcorner=4pt, backgroundcolor=gray!5]{solution}

\\title{Homework \\#1}
\\author{Your Name \\\\\\\\ Course: MATH 101 \\\\\\\\ Instructor: Prof.\\ Smith}
\\date{\\today}

\\begin{document}
\\maketitle

\\problem{1}
Prove that $\\sqrt{2}$ is irrational.

\\begin{solution}
\\textbf{Proof.} Assume for contradiction that $\\sqrt{2} = \\frac{p}{q}$ where $p, q \\in \\mathbb{Z}$ with $\\gcd(p,q) = 1$.

Then $2q^2 = p^2$, so $p^2$ is even, hence $p$ is even. Write $p = 2k$.

Then $2q^2 = 4k^2$, so $q^2 = 2k^2$, thus $q$ is also even.

This contradicts $\\gcd(p,q) = 1$. \\qed
\\end{solution}

\\problem{2}
Evaluate $\\displaystyle \\int_0^1 x^2 e^x \\, dx$.

\\begin{solution}
Using integration by parts twice:
\\begin{align}
\\int_0^1 x^2 e^x \\, dx &= \\left[x^2 e^x\\right]_0^1 - 2\\int_0^1 x e^x \\, dx \\\\
&= e - 2\\left(\\left[x e^x\\right]_0^1 - \\int_0^1 e^x \\, dx\\right) \\\\
&= e - 2(e - (e - 1)) \\\\
&= e - 2 \\approx 0.718
\\end{align}
\\end{solution}

\\problem{3}
Your problem here\\ldots

\\begin{solution}
Your solution here\\ldots
\\end{solution}

\\end{document}`,
    },
    {
        id: "meeting-notes",
        name: "Meeting Notes",
        description: "Structured meeting minutes with attendees, agenda, and action items.",
        category: "general",
        icon: "🗓️",
        content: `\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{booktabs}
\\usepackage{xcolor}

\\definecolor{action}{RGB}{16, 185, 129}

\\title{Meeting Notes}
\\author{Project Team Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\section*{Meeting Details}
\\begin{tabular}{@{}ll@{}}
\\textbf{Date:} & \\today \\\\
\\textbf{Time:} & 14:00 -- 15:00 \\\\
\\textbf{Location:} & Room 301 / Zoom \\\\
\\textbf{Chair:} & Your Name \\\\
\\end{tabular}

\\section*{Attendees}
\\begin{itemize}[leftmargin=1.5em]
  \\item Person A (Role)
  \\item Person B (Role)
  \\item Person C (Role) --- \\textit{absent}
\\end{itemize}

\\section*{Agenda}
\\begin{enumerate}
  \\item Review of last meeting's action items
  \\item Project update
  \\item Budget discussion
  \\item Any other business
\\end{enumerate}

\\section*{Discussion}

\\subsection*{1. Review of Action Items}
All actions from the previous meeting have been completed.

\\subsection*{2. Project Update}
Summary of project progress.

\\subsection*{3. Budget}
Budget is on track.

\\section*{\\textcolor{action}{Action Items}}
\\begin{tabular}{@{}p{6cm}ll@{}}
\\toprule
\\textbf{Action} & \\textbf{Owner} & \\textbf{Due} \\\\
\\midrule
Draft proposal & Person A & 2024-02-15 \\\\
Review code & Person B & 2024-02-12 \\\\
\\bottomrule
\\end{tabular}

\\section*{Next Meeting}
Date: TBD

\\end{document}`,
    },
    {
        id: "cover-letter",
        name: "Cover Letter",
        description: "Professional job application cover letter.",
        category: "professional",
        icon: "💼",
        content: `\\documentclass[11pt, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\pagestyle{empty}

\\begin{document}

\\begin{flushright}
Your Name\\\\
Your Address\\\\
City, Country\\\\
your.email@example.com\\\\
+1 (555) 123-4567\\\\[12pt]
\\today
\\end{flushright}

\\vspace{12pt}

\\noindent
Hiring Manager\\\\
Company Name\\\\
Company Address\\\\
City, Country\\\\

\\vspace{12pt}

\\noindent Dear Hiring Manager,

\\vspace{6pt}

I am writing to express my interest in the \\textbf{[Position Title]} position at \\textbf{[Company Name]}, as advertised on [where you found the job].

In the first paragraph, briefly introduce yourself and explain why you are interested in this role and company specifically.

In the second paragraph, highlight your relevant experience, skills, and achievements that make you a strong candidate. Use specific examples and quantifiable results where possible.

In the third paragraph, explain how your background aligns with the company's mission and the specific requirements of the role.

Thank you for considering my application. I would welcome the opportunity to discuss how my skills and experience can contribute to your team. I am available for an interview at your convenience.

\\vspace{12pt}

\\noindent Yours sincerely,\\\\[24pt]
Your Name

\\end{document}`,
    },
];

export function getTemplatesByCategory(category?: string): LatexTemplate[] {
    if (!category || category === "all") return LATEX_TEMPLATES;
    return LATEX_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): LatexTemplate | undefined {
    return LATEX_TEMPLATES.find((t) => t.id === id);
}
