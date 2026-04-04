#!/usr/bin/env python3
"""Generate comprehensive OpenAI researcher mapping Excel file."""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "OpenAI Researchers"

# Styles
header_font = Font(name="Arial", bold=True, color="FFFFFF", size=11)
header_fill = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
section_fill = PatternFill(start_color="D6E4F0", end_color="D6E4F0", fill_type="solid")
section_font = Font(name="Arial", bold=True, size=11, color="2F5496")
link_font = Font(name="Arial", color="0563C1", underline="single", size=10)
normal_font = Font(name="Arial", size=10)
departed_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
thin_border = Border(
    left=Side(style="thin", color="B4C6E7"),
    right=Side(style="thin", color="B4C6E7"),
    top=Side(style="thin", color="B4C6E7"),
    bottom=Side(style="thin", color="B4C6E7"),
)

# Headers
headers = ["Name", "Role / Title", "Research Direction", "Status", "Current Affiliation", "Email", "LinkedIn", "Personal Webpage", "Google Scholar", "Twitter/X"]
for col, header in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = thin_border

# Column widths
widths = [22, 28, 40, 12, 28, 30, 45, 40, 55, 30]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w

# Freeze top row
ws.freeze_panes = "A2"

# Data: (name, role, direction, status, affiliation, email, linkedin, webpage, scholar, twitter)
researchers = [
    # === SECTION: Research Leadership ===
    ("__SECTION__", "Research Leadership", "", "", "", "", "", "", "", ""),
    ("Jakub Pachocki", "Chief Scientist", "AGI, scaling, optimization, GPT-4, reinforcement learning", "Active", "OpenAI", "verified @openai.com", "https://www.linkedin.com/in/jakub-pachocki/", "", "https://openreview.net/profile?id=~Jakub_Pachocki1", ""),
    ("Mark Chen", "Chief Research Officer (CRO)", "DALL-E, Codex, GPT-4, multimodal, safety, frontier models", "Active", "OpenAI", "verified @openai.com", "https://www.linkedin.com/in/markchen90/", "", "https://scholar.google.com/citations?user=5fU-QMwAAAAJ", "https://x.com/markchen90"),
    ("Wojciech Zaremba", "Co-founder", "Robotics, Codex, GPT, GitHub Copilot, code generation", "Active", "OpenAI", "", "https://www.linkedin.com/in/wojciech-zaremba-356568164/", "", "https://scholar.google.com/citations?user=XCZpOcAAAAAJ", ""),
    ("Greg Brockman", "Co-founder, President", "Technical leadership, infrastructure, product", "Active (returned late 2024)", "OpenAI", "", "", "", "", "https://x.com/gaboribe"),

    # === SECTION: Reasoning & RL ===
    ("__SECTION__", "Reasoning & Reinforcement Learning (o1/o3)", "", "", "", "", "", "", "", ""),
    ("Noam Brown", "Research Scientist", "Reasoning (o1/o3), game theory, self-play, multi-agent, poker AI", "Active", "OpenAI", "verified @cs.cmu.edu", "https://www.linkedin.com/in/noam-brown-8b785b62/", "https://noambrown.github.io/", "https://scholar.google.com/citations?user=RLDbLcUAAAAJ", "https://x.com/polynoamial"),
    ("Ilge Akkaya", "Team Lead, LLM Reasoning Research", "Reasoning models (o1/o3), robotics", "Active", "OpenAI", "", "", "https://ilge.github.io/", "", ""),
    ("Bowen Baker", "Research Scientist", "Multi-agent AI, emergent behavior, o1", "Active", "OpenAI", "", "", "https://bowenbaker.github.io/", "https://scholar.google.com/citations?user=bMfPYdYAAAAJ", ""),
    ("Hunter Lightman", "Researcher", "Math reasoning, MathGen, process reward models", "Active", "OpenAI", "", "", "", "", ""),
    ("Karl Cobbe", "Researcher", "Math reasoning, verifiers, GSM8K dataset", "Active", "OpenAI", "", "https://www.linkedin.com/in/kcobbe/", "", "", ""),
    ("Hyung Won Chung", "Research Scientist", "Reasoning, LLM capabilities, instruction fine-tuning (ex-Google Brain, PaLM, Flan)", "Active", "OpenAI", "", "", "https://hwchung2.github.io/", "", ""),
    ("Boaz Barak", "Researcher", "Theoretical CS, reasoning, o1", "Active", "OpenAI", "", "", "", "", ""),
    ("Aaron Jaech", "Researcher", "Reasoning, o1 system card lead author", "Active", "OpenAI", "", "", "", "", ""),
    ("Alexander Wei", "Researcher", "Reasoning, alignment, o1", "Active", "OpenAI", "", "", "", "", ""),
    ("Botao Hao", "Researcher", "Reinforcement learning, reasoning, o1", "Active", "OpenAI", "", "", "", "", ""),
    ("Yura Burda", "Researcher", "Exploration in RL, curiosity-driven learning, math reasoning", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Language Models & Pretraining ===
    ("__SECTION__", "Language Models & Pretraining", "", "", "", "", "", "", "", ""),
    ("Alec Radford", "Research Scientist", "GPT-1/2/3, CLIP, Whisper, language model pretraining", "Active", "OpenAI", "", "", "", "https://scholar.google.com/citations?user=dOad5HoAAAAJ", ""),
    ("Liam Fedus", "Research Scientist", "Language models, scaling, mixture of experts, GPT-4", "Active", "OpenAI", "", "", "", "", ""),
    ("Nick Ryder", "Research Scientist", "Language models, GPT-3/4, pretraining", "Active", "OpenAI", "", "", "", "", ""),
    ("Łukasz Kaiser", "Research Scientist", "Transformers, sequence modeling (ex-Google Brain)", "Active", "OpenAI", "", "", "", "", ""),
    ("Łukasz Kondraciuk", "Researcher", "Pretraining, GPT-4", "Active", "OpenAI", "", "", "", "", ""),
    ("Igor Babuschkin", "Researcher", "Training infrastructure, pretraining", "Active", "OpenAI", "", "", "", "", ""),
    ("Scott Gray", "Researcher", "GPU kernels, training infrastructure, performance optimization", "Active", "OpenAI", "", "", "", "", ""),
    ("Clemens Winter", "Researcher", "Language models, GPT-3/4, pretraining", "Active", "OpenAI", "", "", "", "", ""),
    ("Mohammad Bavarian", "Researcher", "Language models, fine-tuning, GPT-4", "Active", "OpenAI", "", "", "", "", ""),
    ("Heewoo Jun", "Researcher", "Language models, generative models, Point-E", "Active", "OpenAI", "", "", "", "https://openreview.net/profile?id=~Heewoo_Jun2", ""),

    # === SECTION: Multimodal & Vision ===
    ("__SECTION__", "Multimodal & Vision", "", "", "", "", "", "", "", ""),
    ("Aditya Ramesh", "VP of Research (Worldsim)", "DALL-E 1&2, Sora, image generation, world simulation", "Active", "OpenAI", "contact via adityaramesh.com", "https://www.linkedin.com/in/aditya-ramesh-89244b2a5/", "http://adityaramesh.com/", "https://scholar.google.com/citations?user=60K82BkAAAAJ", ""),
    ("Prafulla Dhariwal", "Research Scientist", "Generative models, diffusion models, DALL-E, Jukebox", "Active", "OpenAI", "", "", "https://prafulladhariwal.com/", "", ""),
    ("Jong Wook Kim", "Research Scientist", "CLIP, Whisper, audio/multimodal, music IR", "Active", "OpenAI", "", "", "", "https://scholar.google.com/citations?user=MoX2ERkAAAAJ", ""),
    ("Gabriel Goh", "Research Scientist", "Long context, multimodal, GPT-4V co-lead", "Active", "OpenAI", "", "", "", "", ""),
    ("Chelsea Voss", "Research Scientist", "Safety, interpretability, multimodal, GPT-4o", "Active", "OpenAI", "", "", "", "", ""),
    ("Irwan Bello", "Research Scientist", "Attention mechanisms, vision, architecture", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Audio & Speech ===
    ("__SECTION__", "Audio & Speech", "", "", "", "", "", "", "", ""),
    ("Christine McLeavey", "Researcher", "Audio, Jukebox, MuseNet, music generation", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Safety, Alignment & Policy ===
    ("__SECTION__", "Safety, Alignment & Policy", "", "", "", "", "", "", "", ""),
    ("Aleksander Madry", "Head of Preparedness", "AI safety, robustness, adversarial ML, preparedness (MIT professor)", "Active", "OpenAI / MIT", "", "https://www.linkedin.com/in/aleksander-madry-61115b233/", "https://madry.mit.edu/", "https://scholar.google.com/citations?user=SupjsEUAAAAJ", "https://x.com/aleks_madry"),
    ("Sandhini Agarwal", "Researcher", "AI policy, safety, fairness, responsible deployment", "Active", "OpenAI", "", "https://www.linkedin.com/in/sandhini-agarwal", "", "https://scholar.google.com/citations?user=8UZIqcoAAAAJ", ""),
    ("Shibani Santurkar", "Researcher", "Safe & reliable ML, language model opinions, robustness", "Active", "OpenAI", "", "https://www.linkedin.com/in/shibani-santurkar-63242449/", "https://shibanisanturkar.com/", "", ""),
    ("Lama Ahmad", "Researcher", "AI policy, red teaming, responsible deployment", "Active", "OpenAI", "", "", "", "", ""),
    ("Rosie Campbell", "Researcher", "AI safety, governance", "Active", "OpenAI", "", "", "", "", ""),
    ("Andrea Vallone", "Researcher", "Safety evaluations, red teaming", "Active", "OpenAI", "", "", "", "", ""),
    ("Todor Markov", "Researcher", "Safety, content policy, language model guardrails", "Active", "OpenAI", "", "", "", "", ""),
    ("Tyna Eloundou", "Researcher", "AI economics, labor market impact of AI", "Active", "OpenAI", "", "", "", "", ""),
    ("Daniel Kokotajlo", "Researcher", "AI forecasting, governance, timelines", "Departed", "", "", "", "", "", ""),

    # === SECTION: Optimization & Infrastructure ===
    ("__SECTION__", "Optimization & Infrastructure", "", "", "", "", "", "", "", ""),
    ("Christopher Berner", "Researcher", "Training infrastructure, Dota2, distributed systems", "Active", "OpenAI", "", "", "", "", ""),
    ("Trevor Cai", "Researcher", "Training infrastructure, optimization, scaling", "Active", "OpenAI", "", "", "", "", ""),
    ("David Farhi", "Researcher", "Optimization, architecture, GPT-4 pretraining", "Active", "OpenAI", "", "", "", "", ""),
    ("Phil Tillet", "Researcher", "GPU programming, Triton compiler", "Active", "OpenAI", "", "", "", "", ""),
    ("Ingmar Kanitscheider", "Research Scientist", "LLM tuning, computational neuroscience", "Active", "OpenAI", "", "https://www.linkedin.com/in/ingmar-kanitscheider-148620127/", "", "", ""),
    ("Tomer Kaftan", "Researcher", "Infrastructure, Sora, training systems", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Post-training & RLHF ===
    ("__SECTION__", "Post-training & RLHF", "", "", "", "", "", "", "", ""),
    ("Long Ouyang", "Researcher", "InstructGPT, RLHF, human feedback, human-AI collaboration", "Active", "OpenAI", "", "https://www.linkedin.com/in/longouyang/", "http://zx.gd/academic/", "", ""),
    ("Ashvin Nair", "Researcher", "RL, post-training, reasoning", "Active", "OpenAI", "", "", "", "", ""),
    ("Daniel Levy", "Researcher", "Post-training, RLHF, alignment", "Active", "OpenAI", "", "", "", "", ""),
    ("Daniel Selsam", "Researcher", "Formal reasoning, theorem proving, math AI", "Active", "OpenAI", "", "", "", "", ""),
    ("Benjamin Sokolowsky", "Researcher", "Post-training, safety, o1", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Evaluation & Analysis ===
    ("__SECTION__", "Evaluation & Analysis", "", "", "", "", "", "", "", ""),
    ("Peter Welinder", "VP of Product / Research", "Evaluation, APIs, product-research integration", "Active", "OpenAI", "", "", "", "", ""),
    ("Girish Sastry", "Researcher", "AI evaluation, benchmarks, capability assessment", "Active", "OpenAI", "", "", "", "", ""),
    ("Josh Achiam", "Researcher", "Safety evaluation, constrained RL", "Active", "OpenAI", "", "", "", "", ""),
    ("Steven Adler", "Researcher", "Safety evaluation, red teaming", "Active", "OpenAI", "", "", "", "", ""),
    ("Jan Hendrik Kirchner", "Researcher", "Process reward models, evaluation", "Active", "OpenAI", "", "", "", "", ""),
    ("Richard Ngo", "Researcher", "AI governance, alignment theory", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Code & Tools ===
    ("__SECTION__", "Code & Tools", "", "", "", "", "", "", "", ""),
    ("Adrien Ecoffet", "Researcher", "Exploration, code generation, AI agents", "Active", "OpenAI", "", "", "", "", ""),
    ("Shixiang Shane Gu", "Research Scientist", "RL, agents, code generation (ex-Google Brain)", "Active", "OpenAI", "", "", "", "", ""),
    ("Arka Dhar", "Researcher", "Code generation, GPT-4 code capabilities", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Scaling & Theory ===
    ("__SECTION__", "Scaling & Theory", "", "", "", "", "", "", "", ""),
    ("Jared Kaplan", "Researcher (former)", "Scaling laws, neural network theory", "Departed", "Anthropic (Co-founder)", "", "", "", "", ""),
    ("Yang Song", "Research Scientist", "Score-based generative models, diffusion", "Active", "OpenAI", "", "", "", "", ""),
    ("Luke Metz", "Researcher", "Optimization, meta-learning, learned optimizers", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Other Notable Active Researchers ===
    ("__SECTION__", "Other Notable Active Researchers", "", "", "", "", "", "", "", ""),
    ("Joost Huizinga", "Researcher", "Quality diversity, evolutionary algorithms, open-endedness", "Active", "OpenAI", "", "", "", "", ""),
    ("Giambattista Parascandolo", "Researcher", "Causal inference, representation learning", "Active", "OpenAI", "", "", "", "", ""),
    ("Vitchyr Pong", "Researcher", "RL, goal-conditioned learning", "Active", "OpenAI", "", "", "", "", ""),
    ("Reiichiro Nakano", "Researcher", "WebGPT, tool use, browsing", "Active", "OpenAI", "", "", "", "", ""),
    ("Jeff Wu", "Researcher", "RLHF, InstructGPT, alignment", "Active", "OpenAI", "", "", "", "", ""),
    ("Leo Gao", "Researcher", "Language model evaluation, scaling", "Active", "OpenAI", "", "", "", "", ""),
    ("Rowan Zellers", "Researcher", "NLP, commonsense reasoning (ex-UW)", "Active", "OpenAI", "", "", "", "", ""),
    ("Brandon Houghton", "Researcher", "RL, reasoning, o1", "Active", "OpenAI", "", "", "", "", ""),
    ("Chong Zhang", "Researcher", "Pretraining, GPT-4, o1", "Active", "OpenAI", "", "", "", "", ""),
    ("Andrey Mishchenko", "Researcher", "Training, optimization, GPT-4, o1", "Active", "OpenAI", "", "", "", "", ""),
    ("Pranav Shyam", "Researcher", "Generative models, GPT architecture", "Active", "OpenAI", "", "", "", "", ""),
    ("Arvind Neelakantan", "Researcher", "Language models, embeddings, retrieval", "Active", "OpenAI", "", "", "", "", ""),
    ("Jason Wei", "Researcher", "Chain-of-thought prompting, emergent abilities (ex-Google Brain)", "Active", "OpenAI", "", "", "", "", ""),
    ("Alex Paino", "Researcher", "Training, pretraining, GPT-4", "Active", "OpenAI", "", "", "", "", ""),
    ("Ananya Kumar", "Researcher", "Distribution shift, fine-tuning robustness", "Active", "OpenAI", "", "", "", "", ""),
    ("Ben Chess", "Researcher", "Systems, training infrastructure, GPT-4", "Active", "OpenAI", "", "", "", "", ""),
    ("Casey Chu", "Researcher", "RL, language models", "Active", "OpenAI", "", "", "", "", ""),
    ("Chris Hesse", "Researcher", "Infrastructure, Dota2, systems", "Active", "OpenAI", "", "", "", "", ""),
    ("Dimitris Tsipras", "Researcher", "Robustness, adversarial examples, safety (Madry lab)", "Active", "OpenAI", "", "", "", "", ""),
    ("Rapha Gontijo-Lopes", "Researcher", "Data quality, data curation, scaling", "Active", "OpenAI", "", "", "", "", ""),
    ("Ilya Kostrikov", "Researcher", "RL, offline RL, imitation learning", "Active", "OpenAI", "", "", "", "", ""),
    ("Behrooz Ghorbani", "Researcher", "Scaling, optimization, o1", "Active", "OpenAI", "", "", "", "", ""),

    # === SECTION: Departed - Anthropic ===
    ("__SECTION__", "Departed Researchers - Now at Anthropic", "", "", "", "", "", "", "", ""),
    ("Ilya Sutskever", "Co-founder, Chief Scientist", "Deep learning, GPT series, vision, scaling", "Departed (2024)", "Safe Superintelligence Inc. (CEO)", "", "", "", "", "https://x.com/ilyasut"),
    ("John Schulman", "Co-founder, Head of Alignment", "RL, PPO algorithm, RLHF, ChatGPT alignment", "Departed (2024)", "Thinking Machines Lab (Chief Scientist)", "verified @thinkingmachines.ai", "", "https://joschu.net/", "https://scholar.google.com/citations?user=itSa94cAAAAJ", "https://x.com/johnschulman2"),
    ("Jan Leike", "Co-lead Superalignment", "Alignment, InstructGPT, ChatGPT alignment, RLHF", "Departed (2024)", "Anthropic (Alignment Science Lead)", "", "", "https://jan.leike.name/", "", ""),
    ("Dario Amodei", "VP of Research (former)", "AI safety, scaling, language models", "Departed (2021)", "Anthropic (CEO / Co-founder)", "", "", "", "", ""),
    ("Daniela Amodei", "VP of Operations (former)", "Operations, safety policy", "Departed (2021)", "Anthropic (President / Co-founder)", "", "", "", "", ""),
    ("Sam McCandlish", "Research Lead", "Scaling laws, neural network theory", "Departed (2021)", "Anthropic (Co-founder)", "", "", "", "", ""),
    ("Paul Christiano", "Alignment Researcher", "RLHF (inventor), alignment, iterated amplification", "Departed", "NIST (Head of AI Safety) / ARC founder", "paulfchristiano@gmail.com", "", "https://paulfchristiano.com/", "", ""),

    # === SECTION: Departed - Thinking Machines Lab ===
    ("__SECTION__", "Departed Researchers - Thinking Machines Lab", "", "", "", "", "", "", "", ""),
    ("Mira Murati", "CTO", "Product/research leadership, GPT-4, DALL-E deployment", "Departed (2024)", "Thinking Machines Lab (Co-founder)", "", "", "", "", ""),
    ("Lilian Weng", "VP of Research", "Safety, applied AI, agents, blog author (Lil'Log)", "Departed (2024)", "Thinking Machines Lab", "verified @thinkingmachines.ai", "https://www.linkedin.com/in/lilianweng/", "https://lilianweng.github.io/", "https://scholar.google.com/citations?user=dCa-pW8AAAAJ", "https://x.com/lilianweng"),
    ("Barret Zoph", "VP of Research (Post-Training)", "Post-training, ChatGPT, alignment, NAS", "Returned to OpenAI (2026, GM B2B)", "OpenAI", "", "https://www.linkedin.com/in/barret-zoph-65990543/", "https://barretzoph.github.io/", "", ""),

    # === SECTION: Departed - Meta ===
    ("__SECTION__", "Departed Researchers - Meta / Other", "", "", "", "", "", "", "", ""),
    ("Tim Brooks", "Research Lead, Sora co-lead", "Video generation (Sora), diffusion models", "Departed (2024)", "Meta Superintelligence Labs", "", "", "", "", "https://x.com/_tim_brooks"),
    ("Shengjia Zhao", "Researcher", "ChatGPT, reasoning (o1), generative models", "Departed (2025)", "Meta Superintelligence Labs (Chief Scientist)", "", "", "", "", ""),
    ("Andrej Karpathy", "Founding member, Research Director", "Deep learning, computer vision, LLMs, education", "Departed (2024)", "Eureka Labs (Founder)", "", "https://www.linkedin.com/in/andrej-karpathy-9a650716/", "https://karpathy.ai/", "https://scholar.google.com/citations?user=l8WuQJgAAAAJ", "https://x.com/karpathy"),
    ("Bob McGrew", "Chief Research Officer", "Research leadership, GPT-4, scaling", "Departed (2024)", "", "", "", "", "", ""),
    ("Jerry Tworek", "VP of Research", "ChatGPT, GPT-4, o1/o3 reasoning models", "Departed (2025)", "", "", "", "", "", ""),
    ("Szymon Sidor", "Researcher", "RL, robotics, training infrastructure", "Departed (2023)", "", "", "", "", "", ""),
    ("Rewon Child", "Researcher", "Sparse Transformers, NLP, generative modeling", "Departed", "Inflection AI", "", "", "", "https://scholar.google.com/citations?user=eC3VWhAAAAAJ", ""),
    ("Miles Brundage", "Head of Policy Research", "AI policy, AGI readiness, governance", "Departed (2024)", "Nonprofit sector", "", "", "", "", ""),
    ("Gretchen Krueger", "Researcher", "AI policy, responsible deployment, DALL-E ethics", "Departed", "", "", "", "", "", ""),
    ("Suchir Balaji", "Researcher", "Training data, GPT-4, copyright/fair use research", "Departed (2024)", "", "", "", "", "", ""),
    ("Logan Kilpatrick", "Developer Relations", "Developer ecosystem, API, community", "Departed (2024)", "Google", "", "", "", "", ""),
    ("Cullen O'Keefe", "Researcher", "AI governance, law, policy", "Departed", "", "", "", "", "", ""),
]

row = 2
for r in researchers:
    if r[0] == "__SECTION__":
        # Section header
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=10)
        cell = ws.cell(row=row, column=1, value=r[1])
        cell.font = section_font
        cell.fill = section_fill
        cell.alignment = Alignment(horizontal="left", vertical="center")
        for col in range(1, 11):
            ws.cell(row=row, column=col).fill = section_fill
            ws.cell(row=row, column=col).border = thin_border
        row += 1
        continue

    name, role, direction, status, affiliation, email, linkedin, webpage, scholar, twitter = r
    is_departed = "Departed" in status

    for col, val in enumerate([name, role, direction, status, affiliation, email, linkedin, webpage, scholar, twitter], 1):
        cell = ws.cell(row=row, column=col, value=val)
        cell.font = normal_font
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = thin_border
        if is_departed:
            cell.fill = departed_fill
        # Make URLs clickable
        if val and val.startswith("http"):
            cell.font = link_font
            cell.hyperlink = val

    row += 1

# Add legend at bottom
row += 2
ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=4)
cell = ws.cell(row=row, column=1, value="Legend:")
cell.font = Font(name="Arial", bold=True, size=11)

row += 1
cell = ws.cell(row=row, column=1, value="")
cell.fill = departed_fill
ws.cell(row=row, column=2, value="Yellow = Departed from OpenAI").font = normal_font

row += 1
ws.cell(row=row, column=1, value="").fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
ws.cell(row=row, column=2, value="White = Currently at OpenAI (to the best of public knowledge)").font = normal_font

row += 1
ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
ws.cell(row=row, column=1, value="Note: This list includes ~100 key researchers. Full contributor lists (300+ people) are on OpenAI's official contribution pages.").font = Font(name="Arial", italic=True, size=9, color="666666")

row += 1
ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
ws.cell(row=row, column=1, value="Sources: GPT-4 Technical Report (arXiv:2303.08774), o1 System Card (arXiv:2412.16720), openai.com/research").font = Font(name="Arial", italic=True, size=9, color="666666")

# Auto-filter
ws.auto_filter.ref = f"A1:J{row - 4}"

output_path = "/home/user/claude-skills-dev/openai_researchers_mapping.xlsx"
wb.save(output_path)
print(f"Excel file saved to {output_path}")
print(f"Total researchers: {sum(1 for r in researchers if r[0] != '__SECTION__')}")
