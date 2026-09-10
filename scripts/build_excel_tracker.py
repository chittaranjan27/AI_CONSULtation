import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def build_excel_tracker():
    wb = openpyxl.Workbook()
    
    # ---------------------------------------------------------
    # COLOR PALETTE & STYLES (Sleek Modern Executive Theme)
    # ---------------------------------------------------------
    NAVY_HEADER = "1E293B"      # Dark Slate/Navy for main headers
    ACCENT_BLUE = "2563EB"      # Vivid Blue accent
    SUB_HEADER = "334155"       # Medium Slate for section headers
    LIGHT_BLUE = "EFF6FF"       # Soft Light Blue background
    LIGHT_GRAY = "F8FAFC"       # Soft Light Gray stripe background
    WHITE = "FFFFFF"
    
    # Status Colors (Fills & Text)
    GREEN_FILL = "DCFCE7"       # Completed / Active
    GREEN_TEXT = "166534"
    YELLOW_FILL = "FEF9C3"      # Testing / In Progress
    YELLOW_TEXT = "854D0E"
    ORANGE_FILL = "FFEDD5"      # Partial / Planned
    ORANGE_TEXT = "9A3412"
    BLUE_FILL = "DBEAFE"        # Informational
    BLUE_TEXT = "1E40AF"
    
    # Priority Colors
    P0_FILL = "FEE2E2"          # P0 Critical
    P0_TEXT = "991B1B"
    P1_FILL = "FFEDD5"          # P1 High
    P1_TEXT = "9A3412"
    P2_FILL = "FEF9C3"          # P2 Medium
    P2_TEXT = "854D0E"
    
    # Fonts
    font_title = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    font_subtitle = Font(name="Calibri", size=11, italic=True, color="E2E8F0")
    font_sec_header = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
    font_tbl_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=11, bold=True, color="0F172A")
    font_regular = Font(name="Calibri", size=11, color="0F172A")
    font_kpi_val = Font(name="Calibri", size=18, bold=True, color="1E3A8A")
    font_kpi_lbl = Font(name="Calibri", size=10, bold=True, color="475569")
    
    # Fills
    fill_header = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    fill_sub_header = PatternFill(start_color=SUB_HEADER, end_color=SUB_HEADER, fill_type="solid")
    fill_accent = PatternFill(start_color=ACCENT_BLUE, end_color=ACCENT_BLUE, fill_type="solid")
    fill_light_blue = PatternFill(start_color=LIGHT_BLUE, end_color=LIGHT_BLUE, fill_type="solid")
    fill_stripe = PatternFill(start_color=LIGHT_GRAY, end_color=LIGHT_GRAY, fill_type="solid")
    
    # Alignments
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    align_right = Alignment(horizontal="right", vertical="center", wrap_text=True)
    align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)
    
    # Borders
    thin_border_side = Side(border_style="thin", color="CBD5E1")
    border_all = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    border_thick_bottom = Border(bottom=Side(border_style="medium", color="1E293B"))

    # Remove default sheet
    default_sheet = wb.active

    # =========================================================
    # SHEET 1: Executive Summary
    # =========================================================
    ws1 = wb.create_sheet(title="Executive Summary")
    ws1.views.sheetView[0].showGridLines = True

    # Title Banner
    ws1.merge_cells("A1:G1")
    ws1["A1"] = "Brahma AI / AIAssist - Complete Project Overview & Tracker"
    ws1["A1"].font = font_title
    ws1["A1"].fill = fill_header
    ws1["A1"].alignment = align_center
    ws1.row_dimensions[1].height = 40

    ws1.merge_cells("A2:G2")
    ws1["A2"] = "Multi-Tenant AI Consultation, RAG Knowledge Engine & Lead Conversion SaaS Platform"
    ws1["A2"].font = font_subtitle
    ws1["A2"].fill = fill_header
    ws1["A2"].alignment = align_center
    ws1.row_dimensions[2].height = 24

    # System Credentials & Environment Section
    ws1.merge_cells("A4:G4")
    ws1["A4"] = "1. SYSTEM ACCESS & LIVE CREDENTIALS"
    ws1["A4"].font = font_sec_header
    ws1["A4"].fill = fill_sub_header
    ws1["A4"].alignment = align_left
    ws1.row_dimensions[4].height = 25

    headers_cred = ["Environment / Portal", "Access URL / Location", "Username / Email", "Password", "Role / Scope", "Purpose", "Status"]
    for col_num, h in enumerate(headers_cred, 1):
        cell = ws1.cell(row=5, column=col_num, value=h)
        cell.font = font_tbl_header
        cell.fill = fill_accent
        cell.alignment = align_header
        cell.border = border_all
    ws1.row_dimensions[5].height = 24

    cred_data = [
        ["Live Production App", "https://aiassist.noeticminds.com/", "webdevteam.099@gmail.com", "Nmc09876", "Tenant Owner (John)", "End-user SaaS & Customer Portal", "ACTIVE / LIVE"],
        ["Super Admin Portal", "https://aiassist.noeticminds.com/admin", "admin@brahmagraha.com", "password123", "Super Admin", "Global Tenant & System Ops Control", "ACTIVE / LIVE"],
        ["Local Development", "http://localhost:3000", "webdevteam.099@gmail.com", "Nmc09876", "Tenant Owner", "Local Development Server", "ACTIVE"],
        ["Embed Chat Widget", "http://localhost:3000/embed/[id]", "N/A (Public Widget)", "N/A", "Visitor / Customer", "Embeddable Chat Interface", "ACTIVE"],
        ["PostgreSQL Database", "env(DATABASE_URL)", "Configured in .env", "Prisma ORM Managed", "System Storage", "Multi-tenant Relational DB", "CONNECTED"],
    ]

    for row_idx, row_data in enumerate(cred_data, 6):
        ws1.row_dimensions[row_idx].height = 22
        for col_idx, val in enumerate(row_data, 1):
            cell = ws1.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_bold if col_idx in [1, 3] else font_regular
            cell.border = border_all
            cell.alignment = align_center if col_idx in [5, 7] else align_left
            if col_idx == 7:
                cell.fill = PatternFill(start_color=GREEN_FILL, end_color=GREEN_FILL, fill_type="solid")
                cell.font = Font(name="Calibri", size=11, bold=True, color=GREEN_TEXT)

    # Key Performance & Technical Metrics (KPI Cards)
    start_kpi_row = 12
    ws1.merge_cells(f"A{start_kpi_row}:G{start_kpi_row}")
    ws1[f"A{start_kpi_row}"] = "2. KEY PROJECT METRICS & CORE HIGHLIGHTS"
    ws1[f"A{start_kpi_row}"].font = font_sec_header
    ws1[f"A{start_kpi_row}"].fill = fill_sub_header
    ws1[f"A{start_kpi_row}"].alignment = align_left
    ws1.row_dimensions[start_kpi_row].height = 25

    kpis = [
        ("Overall Completion", "92%", "Production Ready SaaS Platform"),
        ("Core Modules", "9 Modules", "Auth, AI, RAG, Widget, Leads, Products, Analytics, Admin, Billing"),
        ("Database Models", "21 Models", "Prisma Relational Multi-tenant Schema"),
        ("API Routes", "28 Endpoints", "Next.js App Router REST API Endpoints"),
        ("AI Providers", "7 Providers", "OpenAI, Anthropic, Gemini, Groq, OpenRouter, Sarvam, Browser"),
        ("Voice Support", "STT + TTS", "OpenAI Whisper Transcribe & OpenAI TTS Synthesize"),
    ]

    kpi_card_row = 14
    for idx, (title, value, subtext) in enumerate(kpis):
        # Place 3 cards per row
        col_start = 1 + (idx % 3) * 2
        r = kpi_card_row if idx < 3 else kpi_card_row + 4
        
        ws1.merge_cells(start_row=r, start_column=col_start, end_row=r, end_column=col_start+1)
        c1 = ws1.cell(row=r, column=col_start, value=title)
        c1.font = font_kpi_lbl
        c1.alignment = align_center
        c1.fill = fill_light_blue
        
        ws1.merge_cells(start_row=r+1, start_column=col_start, end_row=r+1, end_column=col_start+1)
        c2 = ws1.cell(row=r+1, column=col_start, value=value)
        c2.font = font_kpi_val
        c2.alignment = align_center
        c2.fill = fill_light_blue

        ws1.merge_cells(start_row=r+2, start_column=col_start, end_row=r+2, end_column=col_start+1)
        c3 = ws1.cell(row=r+2, column=col_start, value=subtext)
        c3.font = Font(name="Calibri", size=9, italic=True, color="64748B")
        c3.alignment = align_center
        c3.fill = fill_light_blue

        # Apply borders to card cells
        for cr in range(r, r+3):
            for cc in range(col_start, col_start+2):
                ws1.cell(row=cr, column=cc).border = border_all

    # Executive Overview Narrative
    summary_sec_row = 23
    ws1.merge_cells(f"A{summary_sec_row}:G{summary_sec_row}")
    ws1[f"A{summary_sec_row}"] = "3. EXECUTIVE SUMMARY & PLATFORM ARCHITECTURE OVERVIEW"
    ws1[f"A{summary_sec_row}"].font = font_sec_header
    ws1[f"A{summary_sec_row}"].fill = fill_sub_header
    ws1[f"A{summary_sec_row}"].alignment = align_left
    ws1.row_dimensions[summary_sec_row].height = 25

    narrative = (
        "Brahma AI (AIAssist) is an enterprise-grade, multi-tenant AI Consultation and Lead Conversion SaaS platform built on Next.js 16 (App Router), React 19, Tailwind CSS v4, and Prisma ORM with PostgreSQL.\n\n"
        "Key Platform Capabilities:\n"
        "• Multi-Tenant SaaS Isolation: Strict tenant-level data isolation via slug and domain mapping, custom tenant branding, and role-based access control (SUPER_ADMIN, TENANT_OWNER, MANAGER, SUPPORT_AGENT, ANALYST).\n"
        "• Multi-LLM Provider Engine: Native integration with Vercel AI SDK (@ai-sdk) supporting OpenAI (gpt-4o, gpt-4o-mini), Anthropic Claude, Google Gemini, Groq, OpenRouter, and Sarvam with dynamic temperature, token limits, and fallback model execution.\n"
        "• Advanced RAG Knowledge Base: In-memory and vector search engine using OpenAI text-embedding-3-small (1536 dims), document chunking (pdf-parse), cosine similarity matching, and hot-reloading RAG cache for instant document context retrieval.\n"
        "• Customizable Embeddable Chatbot Widget: Lightweight JS loader (widget.js) supporting Floating, Inline, and Fullpage modes, custom theme colors, guided consultation step machines, and live audio STT/TTS interaction.\n"
        "• Automated CRM & Lead Qualification: Intelligent lead capture forms, custom qualification scoring (0-100 score), lead activity event tracking, and conversion funnel analytics.\n"
        "• Local E-Commerce Product Catalog: Embedded custom catalog allowing chatbots to directly present product recommendations with checkout URLs, category filters, and AED/USD pricing.\n"
        "• Super Admin Portal: Dedicated admin portal (/admin) for tenant provisioning, system health monitoring, user impersonation, system-wide notifications, and subscription management."
    )
    
    ws1.merge_cells("A24:G36")
    n_cell = ws1["A24"]
    n_cell.value = narrative
    n_cell.font = font_regular
    n_cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    n_cell.fill = fill_stripe

    # =========================================================
    # SHEET 2: Modules & Feature Breakdown
    # =========================================================
    ws2 = wb.create_sheet(title="Modules & Feature Matrix")
    ws2.views.sheetView[0].showGridLines = True

    ws2.merge_cells("A1:G1")
    ws2["A1"] = "Detailed Modules & Feature Matrix"
    ws2["A1"].font = font_title
    ws2["A1"].fill = fill_header
    ws2["A1"].alignment = align_center
    ws2.row_dimensions[1].height = 35

    headers_mod = ["Module Name", "Feature / Component", "Description & Functional Scope", "Target User Persona", "Status", "Priority", "Key Path / API Endpoint"]
    for col_num, h in enumerate(headers_mod, 1):
        cell = ws2.cell(row=2, column=col_num, value=h)
        cell.font = font_tbl_header
        cell.fill = fill_accent
        cell.alignment = align_header
        cell.border = border_all
    ws2.row_dimensions[2].height = 25

    modules_data = [
        # Auth & Tenancy
        ["Auth & Multi-Tenancy", "Tenant Isolation & Domain Mapping", "Isolated data model using tenantId scoping. Custom domain and slug mapping.", "Tenant Owner / Admin", "Completed (100%)", "P0", "app/(dashboard)/layout.tsx"],
        ["Auth & Multi-Tenancy", "JWT Authentication & Sessions", "Secure JWT cookie-based session management (session_token), bcrypt password hashing.", "All Users", "Completed (100%)", "P0", "lib/auth/auth.ts, app/api/auth/login"],
        ["Auth & Multi-Tenancy", "Role-Based Access Control (RBAC)", "Roles: SUPER_ADMIN, TENANT_OWNER, MANAGER, SUPPORT_AGENT, ANALYST with permission guards.", "All Users", "Completed (100%)", "P0", "prisma/schema.prisma"],
        ["Auth & Multi-Tenancy", "Team Management & Invitations", "Invite team members via email with tokens, customizable role assignment.", "Tenant Owner", "Completed (100%)", "P1", "app/api/tenant/invitations"],
        ["Auth & Multi-Tenancy", "Multi-Workspace Switcher", "Allows users with multiple tenant memberships to seamlessly switch active workspace.", "Tenant Owner / Manager", "Completed (100%)", "P1", "app/api/auth/switch-workspace"],

        # AI Engine & Consultation
        ["AI Consultation Engine", "Multi-Provider LLM Integration", "Unified API interface for OpenAI, Anthropic, Gemini, Groq, OpenRouter, Sarvam, Browser models.", "Chatbot / Visitor", "Completed (100%)", "P0", "lib/ai/providers.ts, app/api/chat"],
        ["AI Consultation Engine", "Fallback Model Execution", "Automatic failover to secondary model/provider if primary AI provider fails.", "Chatbot / Visitor", "Completed (100%)", "P1", "lib/ai/chat.ts"],
        ["AI Consultation Engine", "Guided Consultation Step Machine", "Structured multi-step guided consultation workflows with predefined prompts & quick options.", "Visitor / Customer", "Completed (100%)", "P0", "lib/ai/chat.ts"],
        ["AI Consultation Engine", "Token & Cost Tracking", "Real-time tracking of input/output tokens, estimated API cost, and tenant plan limit checks.", "Tenant Owner", "Completed (100%)", "P0", "lib/billing/limits.ts, UsageRecord"],

        # Knowledge Base & RAG
        ["Knowledge Base & RAG", "Document Ingestion & Parser", "Upload PDF, TXT, CSV documents via pdf-parse, chunking into 500-token snippets.", "Tenant Owner / Support", "Completed (100%)", "P0", "app/api/knowledge/upload"],
        ["Knowledge Base & RAG", "Embedding Generation & Cosine Match", "OpenAI text-embedding-3-small (1536 dims) generation & fast in-memory cosine similarity search.", "Chatbot Engine", "Completed (100%)", "P0", "lib/ai/embeddings.ts, lib/ai/rag.ts"],
        ["Knowledge Base & RAG", "Hot-Reload RAG Cache", "In-memory caching of embeddings per chatbot with automatic cache invalidation on uploads.", "Chatbot Engine", "Completed (100%)", "P1", "lib/ai/rag.ts"],
        ["Knowledge Base & RAG", "Vector Search Debugger", "Interactive UI component to test query similarity, view matching chunks & confidence scores.", "Tenant Owner", "Completed (100%)", "P2", "components/dashboard/VectorSearchDebugger.tsx"],

        # Embeddable Widget & Voice
        ["Embeddable Widget", "JavaScript Loader Script", "Lightweight widget loader (public/widget.js) for embedding on external websites.", "Website Visitors", "Completed (100%)", "P0", "public/widget.js"],
        ["Embeddable Widget", "Iframe Embed Application", "Dedicated embed view with layout modes: Floating badge, Inline container, Fullpage frame.", "Website Visitors", "Completed (100%)", "P0", "app/embed/[chatbotId]/EmbedChat.tsx"],
        ["Embeddable Widget", "Custom Branding & Themes", "Configurable primary/secondary colors, fonts, avatar icons, welcome messages, button styles.", "Tenant Owner", "Completed (100%)", "P1", "app/(dashboard)/dashboard/chatbots/[id]"],
        ["Voice AI System", "Speech-To-Text (STT) Transcribe", "Voice recording input transcribed via OpenAI Whisper API (/api/voice/transcribe).", "Visitor", "Completed (100%)", "P1", "app/api/voice/transcribe/route.ts"],
        ["Voice AI System", "Text-To-Speech (TTS) Synthesize", "AI chatbot response text synthesized to audio stream via OpenAI TTS-1 (/api/voice/synthesize).", "Visitor", "Completed (100%)", "P1", "app/api/voice/synthesize/route.ts"],

        # CRM & Product Catalog
        ["CRM & Lead Capture", "Automated Lead Collection", "In-chat lead capture form collecting Name, Email, Phone, Company, Budget, and Goals.", "Visitor / CRM", "Completed (100%)", "P0", "app/api/leads/route.ts"],
        ["CRM & Lead Capture", "Lead Qualification Scoring", "Algorithmic 0-100 lead score calculation based on lead budget, contact info, and intent.", "Sales / Manager", "Completed (100%)", "P1", "prisma/schema.prisma (Lead.score)"],
        ["CRM & Lead Capture", "Lead Lifecycle & Event Tracking", "Pipeline status tracking (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, WON, LOST) and event log.", "Sales Team", "Completed (100%)", "P1", "app/(dashboard)/dashboard/leads"],
        ["Product Catalog", "Local Product Inventory", "Custom product management (Name, Category, Price, Currency AED/USD, Image, Checkout URL).", "Tenant Owner", "Completed (100%)", "P1", "app/(dashboard)/dashboard/products"],
        ["Product Catalog", "Chatbot Recommendations", "Chatbot seamlessly suggests relevant product cards with buy/checkout links during chat.", "Visitor", "Completed (100%)", "P1", "app/api/products/route.ts"],

        # Analytics & Admin Portal
        ["Analytics & Reporting", "Performance KPI Dashboard", "Daily conversation volume, message counts, response latency, completion rates, conversion funnel.", "Tenant Owner", "Completed (100%)", "P1", "app/(dashboard)/dashboard/analytics"],
        ["Analytics & Reporting", "AI Cost & Token Breakdown", "Detailed cost breakdown comparing LLM API costs vs Voice STT/TTS costs.", "Tenant Owner", "Completed (100%)", "P1", "components/admin/AIUsageCharts.tsx"],
        ["Super Admin Portal", "Tenant Management & Wiping", "Super Admin dashboard listing all tenants, plan tiers, limits, and workspace wiping/reset.", "Super Admin", "Completed (100%)", "P0", "app/(admin)/admin/tenants"],
        ["Super Admin Portal", "User Impersonation API", "Allows Super Admins to securely generate impersonation tokens to view tenant dashboards.", "Super Admin", "Completed (100%)", "P0", "app/api/admin/impersonate"],
        ["Super Admin Portal", "System Alerts & Operations", "System-wide notification center, platform health metrics, and infrastructure ops monitoring.", "Super Admin", "Completed (100%)", "P1", "app/(admin)/admin/system-ops"],
    ]

    for row_idx, row_data in enumerate(modules_data, 3):
        ws2.row_dimensions[row_idx].height = 22
        for col_idx, val in enumerate(row_data, 1):
            cell = ws2.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_regular
            cell.border = border_all
            
            if col_idx in [1, 2]:
                cell.font = font_bold
                cell.alignment = align_left
            elif col_idx in [4, 5, 6]:
                cell.alignment = align_center
            elif col_idx == 7:
                cell.font = Font(name="Consolas", size=9.5, color="1E293B")
                cell.alignment = align_left
            else:
                cell.alignment = align_left
                
            # Status styling
            if col_idx == 5:
                cell.fill = PatternFill(start_color=GREEN_FILL, end_color=GREEN_FILL, fill_type="solid")
                cell.font = Font(name="Calibri", size=10, bold=True, color=GREEN_TEXT)
            # Priority styling
            if col_idx == 6:
                if val == "P0":
                    cell.fill = PatternFill(start_color=P0_FILL, end_color=P0_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=P0_TEXT)
                elif val == "P1":
                    cell.fill = PatternFill(start_color=P1_FILL, end_color=P1_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=P1_TEXT)

    # =========================================================
    # SHEET 3: System Architecture & Data Schema
    # =========================================================
    ws3 = wb.create_sheet(title="Architecture & Schema")
    ws3.views.sheetView[0].showGridLines = True

    ws3.merge_cells("A1:E1")
    ws3["A1"] = "System Architecture, Tech Stack & Database Schema"
    ws3["A1"].font = font_title
    ws3["A1"].fill = fill_header
    ws3["A1"].alignment = align_center
    ws3.row_dimensions[1].height = 35

    # Tech Stack Sub-table
    ws3.merge_cells("A3:E3")
    ws3["A3"] = "1. TECHNOLOGY STACK & CORE LIBRARIES"
    ws3["A3"].font = font_sec_header
    ws3["A3"].fill = fill_sub_header
    ws3["A3"].alignment = align_left
    ws3.row_dimensions[3].height = 24

    headers_tech = ["Layer", "Technology / Library", "Version", "Purpose & Architectural Role", "Status"]
    for col_num, h in enumerate(headers_tech, 1):
        cell = ws3.cell(row=4, column=col_num, value=h)
        cell.font = font_tbl_header
        cell.fill = fill_accent
        cell.alignment = align_header
        cell.border = border_all
    ws3.row_dimensions[4].height = 22

    tech_stack_data = [
        ["Frontend Framework", "Next.js (App Router)", "16.2.6", "Full-stack React framework with server actions, API routes, and SSR", "Active / Modern"],
        ["UI Library", "React & React DOM", "19.2.4", "Core UI rendering library with modern hooks", "Active"],
        ["Styling & Animations", "Tailwind CSS & Framer Motion", "v4.0 / 12.40", "Utility-first styling with sleek ambient animations & glassmorphism", "Active"],
        ["Data Visualization", "Recharts", "3.8.1", "Interactive charts for analytics, token usage, and lead funnels", "Active"],
        ["Database & ORM", "PostgreSQL & Prisma ORM", "6.19.3", "Relational database with multi-tenant data modeling and type safety", "Active"],
        ["AI SDK Core", "Vercel AI SDK (ai)", "6.0.191", "Streamlined streaming text, tool calling, and structured output", "Active"],
        ["AI Provider Adapters", "@ai-sdk/openai, anthropic, google", "3.0.79", "Unified multi-provider client adapters for LLM execution", "Active"],
        ["Document Parsing", "pdf-parse", "2.4.5", "Extraction of plain text from uploaded PDF knowledge documents", "Active"],
        ["Authentication", "jsonwebtoken & bcryptjs", "9.0.3 / 3.0.3", "JWT token signing, session cookies, and secure password hashing", "Active"],
        ["Email Delivery", "Nodemailer", "7.0.13", "SMTP email dispatch with local mock fallback", "Active"],
    ]

    for row_idx, row_data in enumerate(tech_stack_data, 5):
        ws3.row_dimensions[row_idx].height = 20
        for col_idx, val in enumerate(row_data, 1):
            cell = ws3.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_bold if col_idx in [1, 2] else font_regular
            cell.border = border_all
            cell.alignment = align_center if col_idx in [3, 5] else align_left

    # Prisma Database Models Sub-table
    db_start_row = 17
    ws3.merge_cells(f"A{db_start_row}:E{db_start_row}")
    ws3[f"A{db_start_row}"] = "2. PRISMA DATABASE MODELS (21 RELATIONAL ENTITIES)"
    ws3[f"A{db_start_row}"].font = font_sec_header
    ws3[f"A{db_start_row}"].fill = fill_sub_header
    ws3[f"A{db_start_row}"].alignment = align_left
    ws3.row_dimensions[db_start_row].height = 24

    headers_db = ["Model Name", "Category", "Key Attributes & Fields", "Relations & Dependencies", "Description"]
    for col_num, h in enumerate(headers_db, 1):
        cell = ws3.cell(row=db_start_row+1, column=col_num, value=h)
        cell.font = font_tbl_header
        cell.fill = fill_accent
        cell.alignment = align_header
        cell.border = border_all
    ws3.row_dimensions[db_start_row+1].height = 22

    db_models_data = [
        ["Tenant", "Core / Tenancy", "id, name, slug, domain, plan, branding, settings", "Users, Chatbots, Leads, Analytics, Billing", "Main tenant workspace entity"],
        ["User", "Auth & Users", "id, tenantId, email, password, role, isActive", "Tenant, Accounts, Sessions, AssignedConversations", "Platform users & agent accounts"],
        ["Account / Session", "Auth & NextAuth", "id, userId, provider, access_token, expires", "User", "Auth provider tokens and active sessions"],
        ["Invitation", "Tenancy", "id, tenantId, email, role, token, status", "Tenant", "Pending team member workspace invites"],
        ["TenantApiKey", "AI Security", "id, tenantId, provider, encryptedKey, label", "Tenant", "Encrypted tenant-owned API keys"],
        ["Chatbot", "AI Engine", "id, tenantId, name, systemPrompt, aiProvider, widgetConfig", "Tenant, Conversations, Documents, Leads, Products", "Chatbot configuration & prompt settings"],
        ["Visitor", "Conversations", "id, fingerprint, name, email, phone, metadata", "Conversations, Leads", "External website visitor identity"],
        ["Conversation", "Conversations", "id, tenantId, chatbotId, visitorId, status, summary, rating", "Tenant, Chatbot, Visitor, Messages, LeadEvents", "Live chat session state & metadata"],
        ["Message", "Conversations", "id, conversationId, role, content, tokens, cost, latency", "Conversation", "Individual chat messages & token metrics"],
        ["Document", "Knowledge RAG", "id, tenantId, chatbotId, filename, fileType, status, chunkCount", "Tenant, Chatbot, DocumentChunks", "Uploaded knowledge base file container"],
        ["DocumentChunk", "Knowledge RAG", "id, documentId, chatbotId, content, embedding (Float[])", "Document, Chatbot", "Vector chunk content and 1536d embeddings"],
        ["CrawlJob", "Knowledge RAG", "id, chatbotId, url, status, pagesProcessed", "Chatbot", "Website URL crawl job tracking"],
        ["Lead", "CRM", "id, tenantId, chatbotId, visitorId, score, status, budget", "Tenant, Chatbot, Visitor, LeadEvents", "Captured customer lead record & score"],
        ["LeadEvent", "CRM", "id, leadId, conversationId, type, data", "Lead, Conversation", "Timeline history of lead interactions"],
        ["AnalyticsEvent", "Analytics", "id, tenantId, chatbotId, eventType, pageUrl, userAgent", "Tenant", "Raw widget interaction events"],
        ["DailyStats", "Analytics", "id, tenantId, chatbotId, date, conversations, cost", "Tenant, Chatbot", "Aggregated daily performance & cost stats"],
        ["Subscription", "Billing", "id, tenantId, plan, status, stripeSubscriptionId", "Tenant", "Stripe subscription state per tenant"],
        ["UsageRecord", "Billing", "id, tenantId, chatbotId, provider, tokens, cost, requestType", "Tenant, Conversation", "Granular usage records for LLM & Voice"],
        ["Invoice", "Billing", "id, tenantId, stripeInvoiceId, amount, status", "Tenant", "Billing invoices and payment history"],
        ["Integration", "Integrations", "id, tenantId, type, name, config, isActive", "Tenant", "Third-party CRM/tool integration configs"],
        ["Product", "Catalog", "id, tenantId, chatbotId, name, price, currency, checkoutUrl", "Tenant, Chatbot", "Custom product/service recommendation catalog"],
    ]

    for row_idx, row_data in enumerate(db_models_data, db_start_row+2):
        ws3.row_dimensions[row_idx].height = 20
        for col_idx, val in enumerate(row_data, 1):
            cell = ws3.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_bold if col_idx == 1 else font_regular
            cell.border = border_all
            cell.alignment = align_center if col_idx == 2 else align_left

    # =========================================================
    # SHEET 4: Workflows & Operational Flows
    # =========================================================
    ws4 = wb.create_sheet(title="Workflows & Process Diagrams")
    ws4.views.sheetView[0].showGridLines = True

    ws4.merge_cells("A1:F1")
    ws4["A1"] = "End-to-End System Workflows & Data Flows"
    ws4["A1"].font = font_title
    ws4["A1"].fill = fill_header
    ws4["A1"].alignment = align_center
    ws4.row_dimensions[1].height = 35

    workflows = [
        ("Workflow 1: Guided AI Consultation & RAG Retrieval Flow", [
            ("Step 1", "Widget Initialization", "Visitor loads external site containing widget.js. Widget fetches chatbot config & theme via /api/chatbots/[id]."),
            ("Step 2", "User Message Input", "Visitor types a text prompt or sends voice recording (transcribed via OpenAI Whisper API /api/voice/transcribe)."),
            ("Step 3", "RAG Vector Context Retrieval", "System generates query embedding via OpenAI text-embedding-3-small and searches DocumentChunk table using cosine similarity."),
            ("Step 4", "System Prompt & LLM Execution", "System constructs prompt with RAG context & guided consultation step rules, calls AI Provider (OpenAI/Claude/Gemini) with fallback."),
            ("Step 5", "Streaming Response & Voice TTS", "Response streams back to UI. If voice mode is enabled, response text is synthesized to audio via /api/voice/synthesize."),
            ("Step 6", "Lead Capture & Product Suggestion", "If user expresses purchasing/consultation intent, widget renders lead capture form & presents local Product cards with checkout URLs."),
        ]),
        ("Workflow 2: Knowledge Base Ingestion & Indexing Pipeline", [
            ("Step 1", "File Upload Trigger", "Tenant owner uploads PDF/TXT/CSV file in Dashboard (/dashboard/knowledge-base)."),
            ("Step 2", "Text Extraction & Parsing", "Backend route (/api/knowledge/upload) processes document using pdf-parse, extracting raw text."),
            ("Step 3", "Token Chunking", "Text is divided into overlapping chunks (~500 tokens each with 50-token overlap) via lib/ai/chunker.ts."),
            ("Step 4", "Embedding Generation", "OpenAI text-embedding-3-small generates 1536-dimensional vector array for each text chunk."),
            ("Step 5", "Database Persistence", "Document record and DocumentChunk records (with float array embeddings) are saved to PostgreSQL via Prisma."),
            ("Step 6", "RAG Cache Invalidation", "Hot-reload RAG cache is automatically cleared for chatbot ID to ensure fresh knowledge availability."),
        ]),
        ("Workflow 3: Lead Qualification & CRM Sync Lifecycle", [
            ("Step 1", "Lead Data Collection", "Visitor inputs contact info (Name, Email, Phone, Company, Budget) into chatbot form during consultation."),
            ("Step 2", "Lead Creation & Event Log", "Lead record saved with status NEW. LeadEvent logged with type 'created' and conversation ID link."),
            ("Step 3", "Automated Qualification Scoring", "Algorithmic score (0-100) calculated based on budget present (+25), corporate email (+20), clear goals (+25)."),
            ("Step 4", "Dashboard Pipeline View", "Lead appears real-time in Lead Management table (/dashboard/leads) with score badge and conversation transcript."),
            ("Step 5", "Sales Handoff / Integration Sync", "Lead status updated to QUALIFIED or WON. Trigger syncs to configured integrations (Google Sheets/HubSpot)."),
        ]),
        ("Workflow 4: Super Admin System Control & Impersonation", [
            ("Step 1", "Super Admin Auth Guard", "Super Admin logs in at /login with role SUPER_ADMIN, accessing restricted /admin dashboard."),
            ("Step 2", "Tenant & User Governance", "Admin inspects global metrics, active tenant subscriptions, usage limits, and system health status."),
            ("Step 3", "Tenant Impersonation", "Admin clicks 'Impersonate Tenant' -> POST /api/admin/impersonate issues temporary token for seamless troubleshooting."),
            ("Step 4", "System Alert & Ops Management", "Admin reviews system notifications (high AI costs, token limits reached) and executes workspace wipes if needed."),
        ])
    ]

    curr_r = 3
    for title, steps in workflows:
        ws4.merge_cells(f"A{curr_r}:F{curr_r}")
        ws4[f"A{curr_r}"] = title
        ws4[f"A{curr_r}"].font = font_sec_header
        ws4[f"A{curr_r}"].fill = fill_sub_header
        ws4[f"A{curr_r}"].alignment = align_left
        ws4.row_dimensions[curr_r].height = 24
        curr_r += 1

        headers_wf = ["Step", "Stage Name", "Detailed Process Description", "Input / Trigger", "Output / Result", "Status"]
        for col_num, h in enumerate(headers_wf, 1):
            cell = ws4.cell(row=curr_r, column=col_num, value=h)
            cell.font = font_tbl_header
            cell.fill = fill_accent
            cell.alignment = align_header
            cell.border = border_all
        ws4.row_dimensions[curr_r].height = 20
        curr_r += 1

        for step_num, step_title, step_desc in steps:
            ws4.row_dimensions[curr_r].height = 22
            ws4.cell(row=curr_r, column=1, value=step_num).alignment = align_center
            ws4.cell(row=curr_r, column=2, value=step_title).font = font_bold
            ws4.cell(row=curr_r, column=3, value=step_desc).font = font_regular
            ws4.cell(row=curr_r, column=4, value="User Action / System API").alignment = align_center
            ws4.cell(row=curr_r, column=5, value="State Update / Response").alignment = align_center
            c_stat = ws4.cell(row=curr_r, column=6, value="FULLY OPERATIONAL")
            c_stat.alignment = align_center
            c_stat.fill = PatternFill(start_color=GREEN_FILL, end_color=GREEN_FILL, fill_type="solid")
            c_stat.font = Font(name="Calibri", size=10, bold=True, color=GREEN_TEXT)

            for cc in range(1, 7):
                ws4.cell(row=curr_r, column=cc).border = border_all
            curr_r += 1

        curr_r += 2 # gap between workflows

    # =========================================================
    # SHEET 5: Pending Tasks & Enhancement Roadmap
    # =========================================================
    ws5 = wb.create_sheet(title="Pending Tasks & Roadmap")
    ws5.views.sheetView[0].showGridLines = True

    ws5.merge_cells("A1:G1")
    ws5["A1"] = "Pending Tasks, Technical Backlog & Product Roadmap"
    ws5["A1"].font = font_title
    ws5["A1"].fill = fill_header
    ws5["A1"].alignment = align_center
    ws5.row_dimensions[1].height = 35

    headers_tasks = ["Task ID", "Module / Area", "Task Description & Technical Requirement", "Priority", "Target Phase", "Est. Effort", "Current Status"]
    for col_num, h in enumerate(headers_tasks, 1):
        cell = ws5.cell(row=2, column=col_num, value=h)
        cell.font = font_tbl_header
        cell.fill = fill_accent
        cell.alignment = align_header
        cell.border = border_all
    ws5.row_dimensions[2].height = 25

    pending_tasks_data = [
        ["TSK-001", "Email System", "Configure Live Production SMTP credentials (SendGrid / AWS SES / Postmark) to replace local console mock logger.", "P0 - Critical", "Phase 1 (Immediate)", "0.5 Days", "Config Ready (Needs Credentials)"],
        ["TSK-002", "Vector DB Scaling", "Migrate Prisma Float[] embedding similarity matching to native PostgreSQL pgvector extension for >100K chunks.", "P1 - High", "Phase 2 (Scalability)", "2.0 Days", "Architecture Planned"],
        ["TSK-003", "Live Handoff WebSockets", "Integrate Pusher / WebSockets for instant real-time notification to human support agents when HANDOFF triggered.", "P1 - High", "Phase 2 (Enhancement)", "3.0 Days", "Schema Ready (HANDOFF status)"],
        ["TSK-004", "Stripe Webhook Handler", "Implement automated Stripe webhook listeners to handle subscription invoice payment successes, failures, and cancellations.", "P1 - High", "Phase 2 (Billing)", "1.5 Days", "Stripe SDK Integrated"],
        ["TSK-005", "CRM Integration OAuth Sync", "Build two-way OAuth synchronization for HubSpot, Salesforce, and Zapier webhook automated triggers.", "P2 - Medium", "Phase 3 (Integrations)", "4.0 Days", "Integration Schema Configured"],
        ["TSK-006", "Voice Streaming Audio", "Implement chunked audio response streaming for Text-to-Speech (TTS) to reduce latency on long voice answers.", "P2 - Medium", "Phase 3 (Voice AI)", "2.5 Days", "STT/TTS API Working"],
        ["TSK-007", "Automated E2E Test Suite", "Develop automated Playwright/Cypress end-to-end test suite for embed chatbot widget, lead capture, and admin portal.", "P2 - Medium", "Phase 3 (QA)", "3.0 Days", "Unit & API Testing Active"],
        ["TSK-008", "Multilingual Auto-Translate", "Expand Sarvam AI & Google Translate integrations for automatic multi-language detection and localized voice prompts.", "P3 - Low", "Phase 4 (Expansion)", "2.0 Days", "Supported Languages Field Built"],
    ]

    for row_idx, row_data in enumerate(pending_tasks_data, 3):
        ws5.row_dimensions[row_idx].height = 22
        for col_idx, val in enumerate(row_data, 1):
            cell = ws5.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_bold if col_idx in [1, 4] else font_regular
            cell.border = border_all
            cell.alignment = align_center if col_idx in [1, 4, 5, 6] else align_left

            # Priority formatting
            if col_idx == 4:
                if "P0" in val:
                    cell.fill = PatternFill(start_color=P0_FILL, end_color=P0_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=P0_TEXT)
                elif "P1" in val:
                    cell.fill = PatternFill(start_color=P1_FILL, end_color=P1_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=P1_TEXT)
                elif "P2" in val:
                    cell.fill = PatternFill(start_color=P2_FILL, end_color=P2_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=P2_TEXT)

            # Status formatting
            if col_idx == 7:
                cell.fill = PatternFill(start_color=YELLOW_FILL, end_color=YELLOW_FILL, fill_type="solid")
                cell.font = Font(name="Calibri", size=10, bold=True, color=YELLOW_TEXT)

    # =========================================================
    # SHEET 6: Known Issues & Technical Debt Registry
    # =========================================================
    ws6 = wb.create_sheet(title="Issues & Risk Registry")
    ws6.views.sheetView[0].showGridLines = True

    ws6.merge_cells("A1:G1")
    ws6["A1"] = "Known Issues, Technical Risk & Mitigation Registry"
    ws6["A1"].font = font_title
    ws6["A1"].fill = fill_header
    ws6["A1"].alignment = align_center
    ws6.row_dimensions[1].height = 35

    headers_issues = ["Issue ID", "Category", "Problem Summary", "Severity", "Impact Analysis", "Current Mitigation / Workaround", "Recommended Long-term Fix"]
    for col_num, h in enumerate(headers_issues, 1):
        cell = ws6.cell(row=2, column=col_num, value=h)
        cell.font = font_tbl_header
        cell.fill = fill_accent
        cell.alignment = align_header
        cell.border = border_all
    ws6.row_dimensions[2].height = 25

    issues_data = [
        ["ISS-001", "Infrastructure", "SMTP missing configuration falls back to console mock logging in lib/email.ts.", "Medium", "System invitation and welcome emails logged to server console instead of sending real email.", "Console mock logs output clear email body for testing.", "Add SMTP credentials (host, port, user, pass) in production .env."],
        ["ISS-002", "Performance", "Vector similarity matching performed in Node.js memory instead of native pgvector database engine.", "Medium / Low", "High CPU/RAM utilization during RAG retrieval if document chunks per tenant exceed 50,000.", "In-memory RAG cache reduces repeated DB vector loads.", "Enable pgvector extension in PostgreSQL database and update Prisma schema."],
        ["ISS-003", "Third-party APIs", "Integration configurations stored in JSON; live automated sync relies on third-party API keys.", "Low", "Integrations display configured status, but real-time push requires valid client credentials.", "Graceful fallback & error message if API key invalid.", "Provide step-by-step OAuth setup wizard in Tenant Integrations page."],
        ["ISS-004", "Voice UX", "Audio response synthesis transfers entire audio buffer at once instead of chunked streaming.", "Low", "Minor 1-2 second latency delay before voice playback begins for long text responses.", "UI shows visual audio loading spinner indicator.", "Implement chunked audio buffer streaming using Web Audio API."],
    ]

    for row_idx, row_data in enumerate(issues_data, 3):
        ws6.row_dimensions[row_idx].height = 24
        for col_idx, val in enumerate(row_data, 1):
            cell = ws6.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_bold if col_idx in [1, 4] else font_regular
            cell.border = border_all
            cell.alignment = align_center if col_idx in [1, 4] else align_left

            # Severity styling
            if col_idx == 4:
                if "High" in val:
                    cell.fill = PatternFill(start_color=P0_FILL, end_color=P0_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=P0_TEXT)
                elif "Medium" in val:
                    cell.fill = PatternFill(start_color=P1_FILL, end_color=P1_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=P1_TEXT)
                else:
                    cell.fill = PatternFill(start_color=BLUE_FILL, end_color=BLUE_FILL, fill_type="solid")
                    cell.font = Font(name="Calibri", size=10, bold=True, color=BLUE_TEXT)

    # Remove initial blank sheet
    if "Sheet" in wb.sheetnames or "Sheet1" in wb.sheetnames:
        for sheetname in ["Sheet", "Sheet1"]:
            if sheetname in wb.sheetnames:
                wb.remove(wb[sheetname])

    # ---------------------------------------------------------
    # AUTO-FIT COLUMN WIDTHS & PADDING FOR ALL SHEETS
    # ---------------------------------------------------------
    for sheet in wb.worksheets:
        for col in sheet.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            
            for cell in col:
                # Ignore merged cells in row 1 & 2 for width calculation
                if cell.row in [1, 2] and sheet.title in ["Executive Summary", "Modules & Feature Matrix", "Architecture & Schema", "Workflows & Process Diagrams", "Pending Tasks & Roadmap", "Issues & Risk Registry"]:
                    continue
                if cell.value:
                    val_str = str(cell.value)
                    # Take line length into account for multiline text
                    lines = val_str.split("\n")
                    for l in lines:
                        if len(l) > max_len:
                            max_len = len(l)
                            
            # Cap width between 14 and 55 for clean visuals
            adjusted_width = min(max(max_len + 4, 14), 58)
            sheet.column_dimensions[col_letter].width = adjusted_width

    # Save output file
    wb.save("AI_Consulttaion( Brahma_ai).xlsx")
    print("AI_Consulttaion( Brahma_ai).xlsx successfully built!")

if __name__ == "__main__":
    build_excel_tracker()
