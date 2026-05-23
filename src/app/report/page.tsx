"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { supabase } from "@/app/lib/supabase";
import { generateReport, ReportData, Answer } from "@/app/lib/scoring";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaClone } from "react-icons/fa";

// ─── Constants ────────────────────────────────────────────────
const RED = "#dc2626";
const DARK = "#2d2d2d";
const GRAY = "#6b7280";

// A4 dimensions at 96dpi: 794px × 1123px
const A4_H = 1123;

// ─── Helpers ─────────────────────────────────────────────────
function Bar({ pct, color = RED }: { pct: number; color?: string }) {
  return (
    <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2
        className="text-xl font-bold uppercase tracking-wider"
        style={{ color: RED }}
      >
        {children}
      </h2>
      <div className="h-0.5 bg-gray-200 mt-2" />
    </div>
  );
}

function Header() {
  return (
    <div
      className="border-b-4 border-red-600 px-6 py-2 flex items-center justify-between"
      style={{ backgroundColor: "#dc2626" }}
    >
      <span className="text-white font-bold tracking-widest text-sm uppercase">
        Career Report
      </span>

      {/* OneGrasp Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Circle + G mark */}
        <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
          {/* Dark circle offset behind */}
          <div
            style={{
              position: "absolute",
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "#2d2d2d",
              top: "50%",
              left: 0,
              transform: "translateY(-50%)",
            }}
          />
          {/* White G */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 30,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            G
          </div>
        </div>

        {/* Text: One + Grasp */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ color: "#fff", fontWeight: 500, fontSize: 18, lineHeight: 1 }}>
            One
          </span>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, lineHeight: 1 }}>
            Grasp
          </span>
        </div>
      </div>
    </div>
  );
}

function Footer({ pageNum }: { pageNum?: number }) {
  return (
    <div className="flex justify-between text-xs text-gray-400 px-8 py-2 border-t border-gray-200">
      <span>☎ 8977760443 &nbsp;✉ support@onegrasp.com</span>
      <span>onegrasp.com{pageNum ? ` | Page ${pageNum}` : ""}</span>
    </div>
  );
}

/**
 * Page wrapper — exactly A4 height (1123px at 96dpi).
 * Content is flex-column: header + body fills remaining space + footer.
 */
function Page({
  children,
  pageNum,
  title,
}: {
  children: React.ReactNode;
  pageNum: number;
  title?: string;
}) {
  return (
    <div
      className="report-page bg-white relative"   // ← "report-page" added here
      style={{
        width: "794px",
        height: `${A4_H}px`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      <Header />
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "20px 32px 8px 32px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {title && (
          <div className="mb-4">
            <h2
              className="text-xl font-bold uppercase tracking-wider"
              style={{ color: RED }}
            >
              {title}
            </h2>
            <div className="h-0.5 bg-gray-200 mt-2" />
          </div>
        )}
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
      </div>
      <Footer pageNum={pageNum} />
    </div>
  );
}

// ─── MBTI descriptions ────────────────────────────────────────
const TRAIT_DESC: Record<string, { q: string; label: string; bullets: string[] }> = {
  E: {
    q: "Where do you prefer to focus your energy and attention?",
    label: "Extrovert",
    bullets: [
      "You are quite talkative, energized and like to spend lots of time with others.",
      "Your primary mode of living is focused externally.",
      "You can easily be distracted.",
      "You are a bit aggressive.",
      "You quickly adapt to a given situation.",
      "You are sometimes described as an attention-seeker.",
    ],
  },
  I: {
    q: "Where do you prefer to focus your energy and attention?",
    label: "Introvert",
    bullets: [
      "You prefer to work independently and in quiet environments.",
      "You are thoughtful, reflective and prefer deep conversations.",
      "You recharge through solitude and focused work.",
      "You are introspective and self-aware.",
      "You tend to think before you speak.",
      "You have a small circle of close, meaningful relationships.",
    ],
  },
  S: {
    q: "How do you grasp and process information?",
    label: "Sensing",
    bullets: [
      "You mostly collect and trust information presented in a detailed and sequential manner.",
      "You think more about the present and learn from the past.",
      "You like to see the practical use of things and learn best from practice.",
      "You notice facts and remember details that are important to you.",
      "You solve problems by working through facts until you understand the problem.",
      "You create meaning from conscious thought and learn by observation.",
    ],
  },
  N: {
    q: "How do you grasp and process information?",
    label: "iNtuitive",
    bullets: [
      "You focus on the big picture rather than minute details.",
      "You are imaginative, original and value inspiration.",
      "You prefer theoretical explanations and future possibilities.",
      "You quickly see connections between different ideas.",
      "You trust your intuition and instincts.",
      "You enjoy abstract and theoretical thinking.",
    ],
  },
  F: {
    q: "How do you make decisions?",
    label: "Feeling",
    bullets: [
      "You seem to make decisions based on your values or the feelings of others involved.",
      "You seem to be ruled by your heart instead of your head.",
      "In your relationships, you appear caring, warm, and tactful.",
      "You look for what is important to others and express concern for others.",
      "You tend to judge situations and others based on feelings and circumstances.",
      "You seek to please others and want to be appreciated.",
    ],
  },
  T: {
    q: "How do you make decisions?",
    label: "Thinking",
    bullets: [
      "You make decisions based on logic and objective analysis.",
      "You are fair and consistent in applying principles.",
      "You value truth and competence over social harmony.",
      "You prefer to be direct and frank in communication.",
      "You focus on tasks rather than people's feelings.",
      "You are skilled at spotting flaws and inconsistencies.",
    ],
  },
  J: {
    q: "How do you prefer to plan your work?",
    label: "Judging",
    bullets: [
      "You prefer a planned or orderly way of life.",
      "You like to have things well-organized.",
      "Your productivity increases when working with structure.",
      "You are self-disciplined and decisive.",
      "You like to have things decided and planned before doing any task.",
      "You seek closure and enjoy completing tasks.",
    ],
  },
  P: {
    q: "How do you prefer to plan your work?",
    label: "Perceiving",
    bullets: [
      "You prefer flexibility and keeping your options open.",
      "You like to adapt and respond to things as they come.",
      "You are comfortable with ambiguity and open-ended situations.",
      "You enjoy exploring possibilities before making decisions.",
      "You are spontaneous and energized by last-minute work.",
      "You resist rigid structure and prefer a fluid approach.",
    ],
  },
};

const INTEREST_DESC: Record<string, { level: string; bullets: string[] }> = {
  Social: {
    level: "Social",
    bullets: [
      "You are humanistic, idealistic, responsible and concerned with the welfare of others.",
      "You enjoy participating in social activities, helping, training or counselling others.",
      "You communicate in a warm, cheerful, tactful manner and can be persuasive.",
      "You like to solve problems through discussions and utilize interpersonal skills.",
      "You are cooperative, friendly, generous, helpful and idealistic.",
      "You like to work with people.",
    ],
  },
  Investigative: {
    level: "Investigative",
    bullets: [
      "You are analytical, intellectual, observant and enjoy research.",
      "You enjoy using logic and solving complex problems.",
      "You are interested in occupations that require observation, learning and investigation.",
      "You are introspective and focused on creative problem solving.",
      "You prefer working with ideas and using technology.",
    ],
  },
  Conventional: {
    level: "Conventional",
    bullets: [
      "You are efficient, careful, conforming, organized and conscientious.",
      "You are organized, detail-oriented and do well with manipulating data and numbers.",
      "You are persistent and reliable in carrying out tasks.",
      "You enjoy working with data, details and creating reports.",
      "You prefer working in a structured environment.",
      "You like to work with data, and you have a numerical or clerical ability.",
    ],
  },
  Realistic: {
    level: "Realistic",
    bullets: [
      "You are practical, concrete and hands-on.",
      "You enjoy working with tools, machines and physical things.",
      "You prefer tasks with clear, tangible results.",
      "You are athletic, mechanical and technologically skilled.",
      "You value practicality and concrete problem-solving.",
    ],
  },
  Artistic: {
    level: "Artistic",
    bullets: [
      "You are expressive, creative and original.",
      "You enjoy working in unstructured situations using imagination and creativity.",
      "You are sensitive, intuitive and value aesthetics.",
      "You express yourself through art, music, writing or performance.",
      "You prefer autonomy and freedom in your work.",
    ],
  },
  Enterprising: {
    level: "Enterprising",
    bullets: [
      "You are ambitious, adventurous and energetic.",
      "You enjoy leading, persuading and managing others.",
      "You are confident, optimistic and like to take risks.",
      "You prefer working on projects that allow you to lead and achieve goals.",
      "You value status, power and material success.",
    ],
  },
};

const MOTIVATOR_DESC: Record<string, string[]> = {
  Adventure: [
    "You enjoy adventure as part of your work.",
    "You enjoy a lot of excitement and adrenaline rush involved in the work.",
    "You may also like work which can involve physical risk.",
  ],
  "High Paced Environment": [
    "You like to work in a highly competitive work environment.",
    "You prefer a high degree of challenge and excitement in your work.",
    "You like a fast-paced work environment.",
  ],
  Creativity: [
    "You enjoy trying innovative solutions.",
    "You enjoy creativity and self-expression.",
    "You dislike conventional and repetitive approaches.",
  ],
  "Social Service": [
    "You like to do work which has some social responsibility.",
    "You like to do work which impacts the world positively.",
    "You like to receive social recognition for the work that you do.",
  ],
  "Continuous Learning": [
    "You like to have consistent professional growth in your field of work.",
    "You like to work in an environment where there is need to update your knowledge at regular intervals.",
    "You like it when your work achievements are evaluated at regular intervals.",
  ],
  "Structured Work Environment": [
    "You prefer a well-defined role with clear expectations and processes.",
    "You thrive in stable, organized and predictable work environments.",
    "You value routine, consistency and clarity in your work.",
  ],
  Independence: [
    "You prefer to work with a high degree of autonomy.",
    "You like to take ownership of your work and make independent decisions.",
    "You value the freedom to choose how and when you complete your tasks.",
  ],
};

const LEARNING_DESC: Record<
  string,
  { bullets: string[]; strategies: string[] }
> = {
  Auditory: {
    bullets: [
      "These individuals learn best through verbal lessons, discussions, talking things through and listening to what others have to say.",
      "Auditory learners interpret the underlying meaning of speech through listening to the voice tone, pitch and speed.",
      "These learners often benefit from reading the text and notes out loud and/or listening to recorded notes.",
    ],
    strategies: [
      "Work in groups or with a study partner; discussions: listening, talking.",
      "Review assignments and text reading before class.",
      "Read notes and text out loud.",
      "Recite information that is important to remember.",
      "Record notes, key information and lectures; listen to recordings regularly.",
      "Use audio books/convert books into audios.",
    ],
  },
  "Read & Write": {
    bullets: [
      "You learn best through reading and writing activities.",
      "You prefer information delivered in words — books, articles, notes and lists.",
      "You benefit from writing summaries, making lists and rewriting notes in your own words.",
    ],
    strategies: [
      "Take detailed notes during lessons.",
      "Rewrite your notes in different formats — outlines, bullet points.",
      "Read widely and deeply in your field.",
      "Write summaries and essays to consolidate learning.",
      "Use annotating and highlighting when reading.",
    ],
  },
  Visual: {
    bullets: [
      "You learn best through visual information such as charts, graphs, diagrams and colours.",
      "Visual learners convert text and information into images and mind maps.",
      "You prefer videos, demonstrations and visual presentations.",
    ],
    strategies: [
      "Create diagrams, mind maps and charts from your notes.",
      "Use colour coding to organize information.",
      "Watch educational videos and tutorials.",
      "Use flashcards with images.",
      "Draw timelines and flowcharts to understand processes.",
    ],
  },
  Kinesthetic: {
    bullets: [
      "You learn through hands-on experience and physical movement.",
      "Kinesthetic learners prefer doing over watching or reading.",
      "You benefit from real-world practice, case studies and simulations.",
    ],
    strategies: [
      "Use hands-on experiments and practical activities.",
      "Take frequent breaks and move around while studying.",
      "Study using role-play and simulation exercises.",
      "Learn by doing rather than reading or watching.",
      "Associate information with physical movements or real-world contexts.",
    ],
  },
};

const EQ_DESC: Record<string, { def: string; recs?: string[] }> = {
  "Self Awareness": {
    def: "Self-Awareness is the ability to recognize and understand your moods, emotions and drives, as well as their effect on others.",
    recs: [
      "Observe the ripple effect of your emotions.",
      "Revisit your values.",
      "Seek feedback from trusted colleagues and mentors.",
    ],
  },
  "Managing Emotions": {
    def: "Emotions self-management is your ability to manage stress, stay honest, take responsibility for your performance & behaviour, handle change, be open to new ideas.",
    recs: [
      "Engage in activities that allow you to get in touch with your emotions (e.g. writing in a journal, meditating).",
      "When you are angry or anxious, breathe right and count to ten.",
      "Prepare an emotion vs reason checklist.",
    ],
  },
  Motivation: {
    def: "Motivation is your ability to constantly try to improve, align yourself with the goals of a group, be ready to act on opportunities, pursue goals persistently despite setbacks.",
  },
  Empathy: {
    def: "Empathy indicates your ability to recognize how people feel, anticipate others' needs, work with many different types of people, understand why others act in specific ways.",
    recs: [
      "Listen to opposing viewpoints and admit when you are wrong.",
      "Work at becoming a better listener.",
      "Acknowledge the other person's feelings.",
    ],
  },
  "Relationship Management": {
    def: "Relationship management indicates your ability to communicate clearly, influence & lead others, cause positive change, manage conflicts, build bonds with others by cooperating.",
  },
};

const EQ_HIGH_SUFFIX: Record<string, string> = {
  "Self Awareness":
    "You may not always be aware of your typical emotional responses to different situations.",
  "Managing Emotions":
    "You are not always able to manage your emotions, impulsive feelings and behaviours.",
  Motivation:
    "You can take the initiative and persevere in the face of obstacles and setbacks. You have a strong drive to achieve your goals.",
  Empathy:
    "You may be viewed as somewhat lacking in interpersonal warmth and concern for others.",
  "Relationship Management":
    "You know how to develop and maintain good relationships, communicate clearly, inspire and influence others, work well in a team, and manage conflict.",
};

// ─── Trait block component ───────────────────────────────────
function TraitBlock({ letter, colors }: { letter: string; colors: string[] }) {
  const info = TRAIT_DESC[letter];
  if (!info) return null;
  const colorIdx = ["E", "S"].includes(letter)
    ? 0
    : ["I", "N"].includes(letter)
      ? 1
      : ["F"].includes(letter)
        ? 2
        : 3;
  return (
    <div
      className="mb-3 rounded overflow-hidden border border-gray-200"
      style={{ fontSize: 12 }}
    >
      <div
        className="px-4 py-2 font-semibold text-white"
        style={{ backgroundColor: DARK, fontSize: 12 }}
      >
        {info.q}
      </div>
      <div className="flex">
        <div
          className="w-14 flex flex-col items-center justify-center py-3"
          style={{ backgroundColor: colors[colorIdx] }}
        >
          <span className="text-white font-black text-xl">{letter}</span>
          <span
            className="text-white mt-1 text-center px-1"
            style={{ fontSize: 10 }}
          >
            {info.label}
          </span>
        </div>
        <ul className="flex-1 px-3 py-2 space-y-0.5">
          {info.bullets.map((b, j) => (
            <li key={j} className="text-gray-700 flex gap-1" style={{ fontSize: 11 }}>
              <span className="text-gray-400">•</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main inner component ─────────────────────────────────────
function ReportInner() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Assessment Candidate");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  useEffect(() => {
    async function fetchAnswers() {
      const { data, error } = await supabase
        .from("answers")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("question_number", { ascending: true });

      if (error || !data?.length) {
        setLoading(false);
        return;
      }

      const email = (data[0] as { user_email?: string }).user_email;
      if (email) {
        const namePart = email.split("@")[0].replace(/[._]/g, " ");
        setUserName(namePart.toUpperCase());
      }

      const generated = generateReport(data as Answer[]);
      setReport(generated);
      setLoading(false);
    }
    fetchAnswers();
  }, [assessmentId]);

  /**
   * PDF generation: clones each page into a temporary off-screen container
   * at a fixed position so html2canvas can capture it regardless of scroll.
   * Guarantees exactly 30 pages.
   */
  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);

    const offscreen = document.createElement("div");
    offscreen.style.cssText = `
      position: fixed;
      top: 0;
      left: -9999px;
      width: 794px;
      height: ${A4_H}px;
      overflow: hidden;
      z-index: 9999;
      pointer-events: none;
      background: white;
    `;
    document.body.appendChild(offscreen);

    try {
      const pdf = new jsPDF("p", "pt", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const pages = reportRef.current.querySelectorAll<HTMLElement>(".report-page");

      for (let i = 0; i < pages.length; i++) {
        setDownloadProgress(`Rendering page ${i + 1} of ${pages.length}…`);

        const clone = pages[i].cloneNode(true) as HTMLElement;
        clone.style.cssText = `
          width: 794px;
          height: ${A4_H}px;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
          background: white;
          font-family: 'Segoe UI', Arial, sans-serif;
        `;
        offscreen.innerHTML = "";
        offscreen.appendChild(clone);

        // Let layout settle
        await new Promise((r) => setTimeout(r, 100));

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          height: A4_H,
          windowWidth: 794,
          windowHeight: A4_H,
          backgroundColor: "#ffffff",
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);
      }

      pdf.save("OneGrasp-Career-Report.pdf");
    } finally {
      document.body.removeChild(offscreen);
      setDownloading(false);
      setDownloadProgress("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">
          Generating your psychometric report…
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            No Report Data Found
          </h1>
          <p className="text-gray-500 mt-2">
            Please complete the assessment first.
          </p>
        </div>
      </div>
    );
  }

  const {
    mbti,
    interests,
    eq,
    motivators,
    topMotivators,
    planningStage,
    planningStageDesc,
    planningRisk,
    planningAction,
    skills,
    overallSkillPct,
    learningStyles,
    dominantLearning,
    clusters,
    topClusters,
    favouritePath,
    strengthsBullets,
    gapBullets,
    eduRoadmap,
    salary,
    pathSkills,
  } = report;

  const STAGES: ReportData["planningStage"][] = [
    "Unaware",
    "Confused",
    "Exploring",
    "Clarity",
    "Future-Ready",
  ];

  const mbtiDims = [
    {
      opp: mbti.EI_dir === "E" ? "Introvert" : "Extrovert",
      pct: mbti.EI,
      dir: mbti.EI_dir === "E" ? "Extrovert" : "Introvert",
    },
    {
      opp: mbti.SN_dir === "S" ? "iNtuitive" : "Sensing",
      pct: mbti.SN,
      dir: mbti.SN_dir === "S" ? "Sensing" : "iNtuitive",
    },
    {
      opp: mbti.TF_dir === "F" ? "Thinking" : "Feeling",
      pct: mbti.TF,
      dir: mbti.TF_dir === "F" ? "Feeling" : "Thinking",
    },
    {
      opp: mbti.JP_dir === "J" ? "Perceiving" : "Judging",
      pct: mbti.JP,
      dir: mbti.JP_dir === "J" ? "Judging" : "Perceiving",
    },
  ];

  const mbtiColors = [RED, DARK, "#22c55e", "#6b7280"];
  const traitColors = [RED, DARK, "#22c55e", "#6b7280"];
  const topInterestNames = interests.slice(0, 3).map((i) => i.name);
  const topMotivatorNames = motivators.slice(0, 3).map((m) => m.name);

  const learningKey = dominantLearning
    .replace(" Learning", "")
    .replace(" learning", "");
  const learningInfo =
    LEARNING_DESC[learningKey] ?? LEARNING_DESC["Auditory"];

  // Split mbti letters into two groups (2 each) for pages 6 & 7
  const mbtiLetters = mbti.type.split("");
  const mbtiP1 = mbtiLetters.slice(0, 2);
  const mbtiP2 = mbtiLetters.slice(2);

  // Split EQ into two groups for pages 15 & 16
  const eqP1 = eq.slice(0, 2);
  const eqP2 = eq.slice(2);

  // Split clusters for career paths (pages 20 & 21)
  const clusterP1 = topClusters.slice(0, 1);
  const clusterP2 = topClusters.slice(1);

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-black text-xl">
            One<span style={{ color: RED }}>Grasp</span>
          </span>
          <span className="text-gray-400 text-sm">|</span>
          <span className="text-gray-500 text-sm">
            Career Report — {userName}
          </span>
        </div>
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow"
        >
          {downloading ? downloadProgress || "Generating PDF…" : "⬇ Download PDF (30 pages)"}
        </button>
      </div>

      {/* Report container — all 30 pages stacked */}
      <div
        ref={reportRef}
        style={{
          width: "794px",
          margin: "0 auto",
          background: "#e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >

        {/* ══════════════════════════════════════════
            PAGE 1: COVER
        ══════════════════════════════════════════ */}
        <div
          className="report-page bg-white"
          style={{
            width: 794,
            height: A4_H,
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Segoe UI', Arial, sans-serif",
          }}
        >
          <Header />
          <div style={{ flex: 1, display: "flex" }}>
            {/* Left dark panel */}
            <div
              style={{
                flex: 1,
                padding: "32px 36px",
                backgroundColor: "#3d3d3d",
                color: "#ccc",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, color: "#aaa" }}>
                Report Prepared For
              </p>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
                {userName}
              </h1>
              <div style={{ height: 4, width: 64, backgroundColor: RED, marginBottom: 24 }} />
              <div
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: RED,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 36,
                }}
              >
                Career Report for Graduates
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "PERSONALITY TYPE", val: `${mbti.type} – ${mbti.typeLabel}` },
                  { label: "TOP INTEREST", val: report.topInterests },
                  { label: "TOP MOTIVATORS", val: topMotivators.join(" · ") },
                  { label: "CAREER FOCUS", val: favouritePath },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{ borderBottom: "1px solid #555", paddingBottom: 14 }}
                  >
                    <p style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>
                      {row.label}
                    </p>
                    <p style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{row.val}</p>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 11, color: "#777", marginTop: 16 }}>
                Career Planning | Study Abroad | Conferences | Certifications | onegrasp.com
              </div>
            </div>
            {/* Right panel */}
            <div
              style={{
                width: 250,
                padding: "28px 24px",
                backgroundColor: "#f9fafb",
                borderLeft: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  borderBottom: `3px solid ${RED}`,
                  paddingBottom: 8,
                  marginBottom: 8,
                }}
              >
                Assessment Report
              </h3>
              {[
                { label: "Report Type", val: "Graduate Career Report" },
                { label: "Assessment By", val: "OneGrasp" },
                { label: "Methodology", val: "Psychometric · Interest · EQ · Skills" },
                { label: "Contact", val: "8977760443" },
                { label: "Email", val: "support@onegrasp.com" },
                { label: "Year", val: "2025" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{ borderBottom: "1px solid #e5e7eb", padding: "10px 0" }}
                >
                  <p style={{ fontSize: 10, color: "#9ca3af" }}>{row.label}</p>
                  <p style={{ fontWeight: 600, fontSize: 12, color: "#1f2937" }}>{row.val}</p>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 72, fontWeight: 900, color: "#e5e7eb" }}>OG</span>
              </div>
            </div>
          </div>
          <Footer pageNum={1} />
        </div>

        {/* ══════════════════════════════════════════
            PAGE 2: PREFACE
        ══════════════════════════════════════════ */}
        <Page pageNum={2} title="Preface">
          <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Dear {userName},</p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            We, on behalf of OneGrasp, congratulate you on availing the Career Planning Assessment.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            We understand your career worries. OneGrasp caters to your unique needs by providing complete career planning — helping you get more out of life and ensuring a better tomorrow. Our researchers are committed to offering solutions aligned with our vision of delivering the best career and education planning services to those who need it most.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            Our customized planning gives direction and meaning to your education and career decisions. By analyzing your career goals, interests, feasibility, and current status, we create a strategy to help you achieve your aspirations.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
            In this journey, we look forward to your support and feedback.
          </p>
          <p style={{ fontWeight: 700, fontSize: 12 }}>Thanking you,</p>
          <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 32 }}>Team OneGrasp</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 32 }}>
            {[
              { n: "01", l: "Your Career Analysis", c: DARK },
              { n: "02", l: "Find Best Career Option", c: RED },
              { n: "03", l: "Your Educational Plan", c: DARK },
              { n: "04", l: "Execution Plan", c: RED },
              { n: "05", l: "Career Counselling", c: "#555" },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  padding: "12px 8px",
                  backgroundColor: s.c,
                  color: "#fff",
                  textAlign: "center",
                  borderRadius: 4,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 900 }}>{s.n}</div>
                <div style={{ fontSize: 10, marginTop: 4, lineHeight: 1.3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: "#f9fafb", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>
              WHAT THIS REPORT COVERS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                "Personality Type (MBTI)", "Career Interest Analysis",
                "Career Motivators", "Learning Style",
                "Emotional Intelligence (EQ)", "Skills & Abilities",
                "Career Clusters", "Career Paths",
                "Education Roadmap", "Salary Insights",
              ].map((item) => (
                <div key={item} style={{ fontSize: 11, color: "#374151", display: "flex", gap: 6 }}>
                  <span style={{ color: RED }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 3: TABLE OF CONTENTS
        ══════════════════════════════════════════ */}
        <Page pageNum={3} title="Table of Contents">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
            {[
              [1, "Cover Page"],
              [2, "Preface"],
              [3, "Table of Contents"],
              [4, "Your Profiling"],
              [5, "Result of Career Personality"],
              [6, "Personality Analysis — Part 1"],
              [7, "Personality Analysis — Part 2"],
              [8, "Career Interest Types"],
              [9, "Career Interest Analysis"],
              [10, "Career Motivator Types"],
              [11, "Career Motivator Analysis"],
              [12, "Learning Style Types"],
              [13, "Learning Style Analysis"],
              [14, "EQ Types"],
              [15, "EQ Analysis — Part 1"],
              [16, "EQ Analysis — Part 2"],
              [17, "Skills and Abilities"],
              [18, "Career Clusters"],
              [19, "Selected Career Clusters"],
              [20, "Career Paths — Cluster 1"],
              [21, "Career Paths — Cluster 2"],
              [22, "Your Favourite Career Path"],
              [23, "Career Path Scenarios"],
              [24, "Career Analysis — Positive"],
              [25, "Gap Analysis — Negative"],
              [26, "Skill & Abilities Strength"],
              [27, "Work Nature"],
              [28, "Education Road Map"],
              [29, "Salary Insights (2025)"],
              [30, "Career Assessment Summary"],
            ].map(([pg, label]) => (
              <div
                key={pg}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  backgroundColor: Number(pg) % 2 === 0 ? "#f9fafb" : "#fff",
                  borderRadius: 4,
                  border: "1px solid #f3f4f6",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: Number(pg) <= 3 ? DARK : Number(pg) <= 10 ? RED : Number(pg) <= 17 ? "#374151" : RED,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginRight: 10,
                  }}
                >
                  {pg}
                </div>
                <span style={{ fontSize: 12, color: "#1f2937", fontWeight: Number(pg) <= 3 ? 700 : 400 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 4: PROFILING
        ══════════════════════════════════════════ */}
        <Page pageNum={4} title="Your Profiling">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            Personal profiling is the first step in career planning. The purpose of profiling is to understand your current career planning stage. It will help decide your career objective and roadmap. The ultimate aim of the planning is to take you from the current stage of career planning to the optimized stage.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            Personal profiling includes information about your current stage, the risk involved and action plan for your career development.
          </p>
          <div
            style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#fff",
              padding: "8px 16px",
              marginBottom: 12,
              borderRadius: 4,
              backgroundColor: DARK,
            }}
          >
            Current Stage of Planning
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 16 }}>
            {STAGES.map((s) => (
              <div
                key={s}
                style={{
                  padding: "10px 4px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 4,
                  backgroundColor: s === planningStage ? RED : "#e5e7eb",
                  color: s === planningStage ? "#fff" : "#4b5563",
                }}
              >
                {s}
              </div>
            ))}
          </div>
          <div
            style={{
              border: `1px solid #fca5a5`,
              borderRadius: 6,
              padding: 16,
              marginBottom: 24,
              backgroundColor: "#fff7f7",
            }}
          >
            <p style={{ fontSize: 12, color: "#1f2937", marginBottom: 8 }}>
              <strong>{planningStage}:</strong> {planningStageDesc}
            </p>
            <p style={{ fontSize: 12, color: "#1f2937", marginBottom: 8 }}>
              <strong>Risk Involved:</strong> {planningRisk}
            </p>
            <p style={{ fontSize: 12, color: "#1f2937" }}>
              <strong>Action Plan:</strong> {planningAction}
            </p>
          </div>
          {/* Planning stage diagram */}
          <div style={{ backgroundColor: "#f9fafb", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 12 }}>
              Career Planning Journey
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {STAGES.map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: s === planningStage ? RED : STAGES.indexOf(s) < STAGES.indexOf(planningStage) ? "#374151" : "#d1d5db",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {i + 1}
                    </div>
                    <p style={{ fontSize: 10, textAlign: "center", marginTop: 6, color: s === planningStage ? RED : "#6b7280", fontWeight: s === planningStage ? 700 : 400 }}>
                      {s}
                    </p>
                  </div>
                  {i < 4 && (
                    <div style={{ height: 2, width: 20, backgroundColor: STAGES.indexOf(s) < STAGES.indexOf(planningStage) ? RED : "#d1d5db", flexShrink: 0, marginBottom: 20 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 5: PERSONALITY RESULT
        ══════════════════════════════════════════ */}
        <Page pageNum={5} title="Result of the Career Personality">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            Personality Assessment will help you understand yourself as a person. It will help you expand your career options in alignment with your personality. Self-understanding and awareness can lead you to more appropriate and rewarding career choices.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            The Personality Type Model identifies four dimensions of personality. Each dimension will give you a clear description of your personality.
          </p>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              padding: "8px 16px",
              marginBottom: 20,
              borderRadius: 4,
              backgroundColor: DARK,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Your Personality Type – {mbti.typeLabel.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {mbtiDims.map((dim, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#6b7280", width: 80, textAlign: "right" }}>{dim.opp}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", width: 80 }}>{dim.pct}% {dim.dir}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                  <div style={{ height: "100%", width: `${dim.pct}%`, backgroundColor: mbtiColors[i], borderRadius: 8 }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 12, width: 36, color: mbtiColors[i] }}>{dim.pct}%</span>
                <span style={{ fontSize: 12, color: "#374151", width: 90 }}>{dim.dir}</span>
              </div>
            ))}
          </div>
          {/* Type summary box */}
          <div
            style={{
              backgroundColor: "#1f2937",
              color: "#fff",
              borderRadius: 8,
              padding: 20,
              display: "flex",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: RED, lineHeight: 1 }}>{mbti.type}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Personality Type</div>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{mbti.typeLabel}</p>
              <p style={{ fontSize: 11, color: "#d1d5db", lineHeight: 1.6 }}>
                Your personality type is determined by the combination of four dimensions that describe how you interact with the world, process information, make decisions and approach life.
              </p>
            </div>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 6: PERSONALITY ANALYSIS PART 1
        ══════════════════════════════════════════ */}
        <Page pageNum={6} title="Your Career Personality Analysis — Part 1">
          {mbtiP1.map((letter) => (
            <TraitBlock key={letter} letter={letter} colors={traitColors} />
          ))}
          <div
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: RED, marginBottom: 8 }}>
              Key Insight
            </p>
            <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
              The first two letters of your personality type ({mbtiP1.join("")}) describe how you energize yourself and how you gather information about the world around you. These dimensions form the foundation of your personality.
            </p>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 7: PERSONALITY ANALYSIS PART 2
        ══════════════════════════════════════════ */}
        <Page pageNum={7} title="Your Career Personality Analysis — Part 2">
          {mbtiP2.map((letter) => (
            <TraitBlock key={letter} letter={letter} colors={traitColors} />
          ))}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: RED, marginBottom: 8 }}>
              Your Strengths
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                mbti.type.includes("F") && "Very loyal and empathetic",
                mbti.type.includes("J") && "Strong sense of duty and organization",
                mbti.type.includes("S") && "Strong practical skills",
                mbti.type.includes("E") && "Good at connecting with others",
                mbti.type.includes("I") && "Deep focus and exceptional concentration",
                mbti.type.includes("N") && "Creative and innovative thinker",
                mbti.type.includes("T") && "Strong analytical and logical reasoning",
                mbti.type.includes("P") && "Adaptable and open to new experiences",
              ]
                .filter(Boolean)
                .map((s) => (
                  <div
                    key={String(s)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#fff7f7",
                      borderLeft: `3px solid ${RED}`,
                      borderRadius: 4,
                      fontSize: 11,
                      color: "#1f2937",
                    }}
                  >
                    {s}
                  </div>
                ))}
            </div>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 8: INTEREST TYPES
        ══════════════════════════════════════════ */}
        <Page pageNum={8} title="Your Career Interest Types">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            The Career Interest Assessment will help you understand which careers might be the best fit for you. It is meant to help you find careers that you might enjoy. Understanding your Top career interest will help you identify a career focus and begin your career planning and exploration process.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
            The Career Interest Assessment (CIA) measures six broad interest patterns that can be used to describe your career interest. Most people's interests are reflected by two or three themes, combined to form a cluster of interests.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {interests.map((item, i) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#4b5563", width: 120 }}>{item.name}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                  <div style={{ height: "100%", width: `${item.pct}%`, backgroundColor: i === 0 ? RED : DARK, borderRadius: 8 }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 12, width: 44, textAlign: "right", color: i === 0 ? RED : DARK }}>
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
          {/* Hexagon-style labels */}
          <div style={{ backgroundColor: "#f9fafb", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 10 }}>
              RIASEC Interest Model
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { code: "R", name: "Realistic", color: "#374151" },
                { code: "I", name: "Investigative", color: RED },
                { code: "A", name: "Artistic", color: "#6b7280" },
                { code: "S", name: "Social", color: RED },
                { code: "E", name: "Enterprising", color: "#374151" },
                { code: "C", name: "Conventional", color: "#6b7280" },
              ].map((item) => (
                <div
                  key={item.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    backgroundColor: "#fff",
                    borderRadius: 4,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      backgroundColor: item.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {item.code}
                  </div>
                  <span style={{ fontSize: 11, color: "#374151" }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 9: INTEREST ANALYSIS
        ══════════════════════════════════════════ */}
        <Page pageNum={9} title="Your Career Interest Analysis">
          {topInterestNames.map((name, idx) => {
            const info = INTEREST_DESC[name];
            if (!info) return null;
            const bgColor = idx === 0 ? RED : idx === 1 ? "#374151" : "#6b7280";
            return (
              <div
                key={name}
                style={{ marginBottom: 16, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}
              >
                <div style={{ padding: "8px 16px", fontWeight: 600, fontSize: 12, color: "#fff", backgroundColor: DARK }}>
                  Your career interest — {name}
                </div>
                <div style={{ display: "flex" }}>
                  <div
                    style={{
                      width: 56,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px 4px",
                      backgroundColor: bgColor,
                    }}
                  >
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{name[0]}</span>
                    <span style={{ color: "#fff", fontSize: 9, marginTop: 4, textAlign: "center" }}>{info.level}</span>
                  </div>
                  <ul style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {info.bullets.map((b, j) => (
                      <li key={j} style={{ fontSize: 11, color: "#374151", display: "flex", gap: 6 }}>
                        <span style={{ color: "#9ca3af" }}>•</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 10: MOTIVATOR TYPES
        ══════════════════════════════════════════ */}
        <Page pageNum={10} title="Your Career Motivator Types">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            Values are the things that are most important to us in our lives and careers. Our values are formed in a variety of ways through our life experiences, our feelings and our families.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
            Being aware of what we value in our lives is important because a career choice that is in-line with our core beliefs and values is more likely to be a lasting and positive choice.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {motivators.map((item, i) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#4b5563", width: 176 }}>{item.name}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${item.pct}%`,
                      backgroundColor: i === 0 ? RED : i < 3 ? DARK : "#9ca3af",
                      borderRadius: 8,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    width: 44,
                    textAlign: "right",
                    color: i < 3 ? RED : "#9ca3af",
                  }}
                >
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 8 }}>Your Top 3 Motivators</p>
            <div style={{ display: "flex", gap: 8 }}>
              {topMotivatorNames.map((name, i) => (
                <div
                  key={name}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    backgroundColor: i === 0 ? RED : DARK,
                    color: "#fff",
                    borderRadius: 6,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>#{i + 1}</div>
                  <div style={{ fontSize: 10, lineHeight: 1.3 }}>{name}</div>
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 11: MOTIVATOR ANALYSIS
        ══════════════════════════════════════════ */}
        <Page pageNum={11} title="Your Career Motivator Analysis">
          {topMotivatorNames.map((name, i) => {
            const bullets = MOTIVATOR_DESC[name] ?? ["This motivator drives your professional choices."];
            const colors = [RED, "#374151", "#22c55e", "#3b82f6"];
            return (
              <div
                key={name}
                style={{ marginBottom: 16, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}
              >
                <div style={{ padding: "8px 16px", fontWeight: 600, fontSize: 12, color: "#fff", backgroundColor: DARK }}>
                  Career motivator — {name}
                </div>
                <div style={{ display: "flex" }}>
                  <div
                    style={{
                      width: 56,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px 4px",
                      backgroundColor: colors[i] ?? DARK,
                    }}
                  >
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{name[0]}</span>
                    <span style={{ color: "#fff", fontSize: 9, marginTop: 4, textAlign: "center" }}>{name.split(" ")[0]}</span>
                  </div>
                  <ul style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {bullets.map((b, j) => (
                      <li key={j} style={{ fontSize: 12, color: "#374151", display: "flex", gap: 6 }}>
                        <span style={{ color: "#9ca3af" }}>•</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              backgroundColor: "#1f2937",
              borderRadius: 8,
              color: "#fff",
            }}
          >
            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>MOTIVATOR PROFILE</p>
            <p style={{ fontSize: 13, fontWeight: 700 }}>{topMotivatorNames.join(" + ")}</p>
            <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 6, lineHeight: 1.5 }}>
              This combination of motivators suggests you thrive in environments that balance {topMotivatorNames[0].toLowerCase()} with {topMotivatorNames[1]?.toLowerCase() ?? "growth"}.
            </p>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 12: LEARNING STYLE TYPES
        ══════════════════════════════════════════ */}
        <Page pageNum={12} title="Your Learning Style Types">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            Your dominant learning style is <strong>{dominantLearning}</strong>. You learn best through the {dominantLearning.toLowerCase()} mode, which shapes how you absorb, process and retain new information.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
            Understanding your learning style helps you choose the most effective study techniques and career environments where your natural learning tendencies will be an asset.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {learningStyles.map((item, i) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#4b5563", width: 160 }}>{item.name}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                  <div style={{ height: "100%", width: `${item.pct}%`, backgroundColor: i === 0 ? RED : DARK, borderRadius: 8 }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 12, width: 44, textAlign: "right", color: i === 0 ? RED : DARK }}>
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
          {/* VARK legend */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              { key: "Visual", icon: "👁", desc: "Learn through charts, diagrams and visual media" },
              { key: "Auditory", icon: "👂", desc: "Learn through listening, discussion and verbal instruction" },
              { key: "Read & Write", icon: "📖", desc: "Learn through reading and writing activities" },
              { key: "Kinesthetic", icon: "🤲", desc: "Learn through hands-on experience and movement" },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  padding: "12px",
                  borderRadius: 6,
                  border: `2px solid ${dominantLearning.includes(item.key) ? RED : "#e5e7eb"}`,
                  backgroundColor: dominantLearning.includes(item.key) ? "#fff7f7" : "#fff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: dominantLearning.includes(item.key) ? RED : DARK }}>
                    {item.key}
                  </span>
                  {dominantLearning.includes(item.key) && (
                    <span style={{ fontSize: 9, backgroundColor: RED, color: "#fff", padding: "2px 6px", borderRadius: 10, marginLeft: "auto" }}>
                      DOMINANT
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 10, color: "#6b7280" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 13: LEARNING STYLE ANALYSIS
        ══════════════════════════════════════════ */}
        <Page pageNum={13} title="Your Learning Style Analysis">
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: DARK,
                color: "#fff",
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 4,
                marginBottom: 12,
              }}
            >
              {dominantLearning} learning style
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {learningInfo.bullets.map((b, i) => (
                <div key={i} style={{ fontSize: 12, color: "#374151", display: "flex", gap: 8, lineHeight: 1.5 }}>
                  <span style={{ color: RED, flexShrink: 0 }}>•</span>{b}
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              borderLeft: `4px solid ${RED}`,
              paddingLeft: 16,
              backgroundColor: "#fff7f7",
              padding: "14px 16px 14px 20px",
              borderRadius: "0 8px 8px 0",
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: RED, marginBottom: 8 }}>
              Learning Improvement Strategies
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {learningInfo.strategies.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: RED,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: 14, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 6 }}>
              Career Environments That Suit Your Learning Style
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
              As a {dominantLearning.toLowerCase()} learner, you will thrive in environments that provide {
                learningKey === "Auditory" ? "regular team discussions, presentations and verbal feedback" :
                  learningKey === "Visual" ? "data visualization tools, dashboards and visual reporting systems" :
                    learningKey === "Kinesthetic" ? "hands-on projects, field work and practical problem-solving" :
                      "documentation, detailed reports and structured written communication"
              }.
            </p>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 14: EQ TYPES
        ══════════════════════════════════════════ */}
        <Page pageNum={14} title="Your EQ Types">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            Emotional intelligence indicates our ability to understand and make sense of our emotions both within ourselves and in our relationships with others.
          </p>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
            Candidates who demonstrate high levels of EI are better at understanding themselves and others, making confident decisions and expressing their views.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {eq.map((item, i) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#4b5563", width: 200 }}>
                  {item.name} <span style={{ color: "#9ca3af" }}>({item.level})</span>
                </span>
                <div style={{ flex: 1, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                  <div style={{ height: "100%", width: `${item.pct}%`, backgroundColor: i === 0 ? RED : DARK, borderRadius: 8 }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 12, width: 44, textAlign: "right", color: RED }}>
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
          {/* EQ wheel */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {eq.map((item, i) => (
              <div
                key={item.name}
                style={{
                  padding: "10px 6px",
                  textAlign: "center",
                  borderRadius: 6,
                  backgroundColor: item.level === "High" ? RED : DARK,
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{item.pct}%</div>
                <div style={{ fontSize: 9, lineHeight: 1.3 }}>{item.name}</div>
                <div
                  style={{
                    fontSize: 9,
                    marginTop: 4,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 4,
                    padding: "2px 4px",
                  }}
                >
                  {item.level}
                </div>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 15: EQ ANALYSIS PART 1
        ══════════════════════════════════════════ */}
        <Page pageNum={15} title="Your EQ Analysis — Part 1">
          {eqP1.map((item) => {
            const info = EQ_DESC[item.name];
            if (!info) return null;
            const suffix = EQ_HIGH_SUFFIX[item.name] ?? "";
            return (
              <div key={item.name} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: 12,
                    color: "#fff",
                    backgroundColor: DARK,
                    borderRadius: "4px 4px 0 0",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderTop: "none",
                    borderRadius: "0 0 4px 4px",
                    padding: 16,
                  }}
                >
                  <p style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>• {info.def}</p>
                  <p style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
                    • Your result indicates that your {item.name.toLowerCase()} level is{" "}
                    <strong>{item.level.toLowerCase()}</strong>. {suffix}
                  </p>
                  {info.recs && item.level !== "High" && (
                    <div style={{ marginTop: 10, paddingLeft: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: RED, marginBottom: 6 }}>
                        Recommendations
                      </p>
                      {info.recs.map((r, j) => (
                        <p key={j} style={{ fontSize: 11, color: "#374151", display: "flex", gap: 6, marginBottom: 4 }}>
                          <span style={{ color: "#9ca3af" }}>•</span>{r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 16: EQ ANALYSIS PART 2
        ══════════════════════════════════════════ */}
        <Page pageNum={16} title="Your EQ Analysis — Part 2">
          {eqP2.map((item) => {
            const info = EQ_DESC[item.name];
            if (!info) return null;
            const suffix = EQ_HIGH_SUFFIX[item.name] ?? "";
            return (
              <div key={item.name} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: 12,
                    color: "#fff",
                    backgroundColor: DARK,
                    borderRadius: "4px 4px 0 0",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderTop: "none",
                    borderRadius: "0 0 4px 4px",
                    padding: 16,
                  }}
                >
                  <p style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>• {info.def}</p>
                  <p style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
                    • Your result indicates that your {item.name.toLowerCase()} level is{" "}
                    <strong>{item.level.toLowerCase()}</strong>. {suffix}
                  </p>
                  {info.recs && item.level !== "High" && (
                    <div style={{ marginTop: 10, paddingLeft: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: RED, marginBottom: 6 }}>
                        Recommendations
                      </p>
                      {info.recs.map((r, j) => (
                        <p key={j} style={{ fontSize: 11, color: "#374151", display: "flex", gap: 6, marginBottom: 4 }}>
                          <span style={{ color: "#9ca3af" }}>•</span>{r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* EQ summary */}
          <div
            style={{
              marginTop: 16,
              padding: 14,
              backgroundColor: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 6 }}>
              Your Overall EQ Profile
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>
              Emotional intelligence is a learnable skill. Focus on developing your lower-scoring areas while leveraging your strengths in{" "}
              {eq.filter((e) => e.level === "High").map((e) => e.name).join(" and ") || eq[0].name}.
            </p>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 17: SKILLS & ABILITIES
        ══════════════════════════════════════════ */}
        <Page pageNum={17} title="Your Skills and Abilities">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>
            The skills & abilities scores will help us to explore and identify different ways to reshape your career direction. This simple graph shows how you have scored on each of these skills and abilities.
          </p>
          <div
            style={{
              fontWeight: 600,
              fontSize: 12,
              color: "#fff",
              padding: "8px 16px",
              marginBottom: 16,
              borderRadius: 4,
              backgroundColor: DARK,
            }}
          >
            Overall Skills and Abilities — {overallSkillPct}%{" "}
            {overallSkillPct >= 75 ? "Excellent" : overallSkillPct >= 65 ? "Good" : "Average"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {skills.map((skill) => (
              <div
                key={skill.name}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    width: 52,
                    textAlign: "center",
                    color:
                      skill.pct >= 75 ? RED : skill.pct >= 60 ? DARK : GRAY,
                    flexShrink: 0,
                  }}
                >
                  {skill.pct}%
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: "#1f2937",
                      marginBottom: 4,
                    }}
                  >
                    {skill.name}
                  </p>
                  {skill.desc.map((d: string, i: number) => (
                    <p
                      key={i}
                      style={{ fontSize: 10, color: "#6b7280", display: "flex", gap: 4, marginBottom: 2 }}
                    >
                      <span style={{ color: "#9ca3af" }}>•</span>{d}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 18: CAREER CLUSTERS
        ══════════════════════════════════════════ */}
        <Page pageNum={18} title="Your Career Clusters">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
            Career Clusters are groups of similar occupations and industries that require similar skills. They provide a career road map for pursuing further education and career opportunities. Career Cluster helps you narrow down your occupation choices based on your assessment responses.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {clusters.map((item, i) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#4b5563", width: 200 }}>{item.name}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${item.pct}%`,
                      backgroundColor: i < 2 ? RED : i < 5 ? "#374151" : "#9ca3af",
                      borderRadius: 8,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    width: 44,
                    textAlign: "right",
                    color: i < 4 ? RED : GRAY,
                  }}
                >
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 19: SELECTED CAREER CLUSTERS
        ══════════════════════════════════════════ */}
        <Page pageNum={19} title="Your Selected Career Clusters">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {topClusters.map((cluster, i) => (
              <div
                key={cluster.name}
                style={{
                  display: "flex",
                  gap: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 18,
                    flexShrink: 0,
                    backgroundColor: i < 2 ? RED : DARK,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 8,
                      color: RED,
                    }}
                  >
                    {cluster.name}
                  </h3>
                  {cluster.description.map((d: string, j: number) => (
                    <p key={j} style={{ fontSize: 11, color: "#374151", display: "flex", gap: 6, marginBottom: 4 }}>
                      <span style={{ color: "#9ca3af" }}>•</span>{d}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 20: CAREER PATHS — CLUSTER 1
        ══════════════════════════════════════════ */}
        <Page pageNum={20} title="Your Career Paths — Cluster 1">
          {clusterP1.map((cluster) => (
            <div key={cluster.name} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#fff",
                  padding: "8px 16px",
                  marginBottom: 8,
                  borderRadius: 4,
                  backgroundColor: DARK,
                }}
              >
                {cluster.name}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ backgroundColor: "#374151", color: "#fff" }}>
                    <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, width: "40%" }}>Career Paths</th>
                    <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Psy. Analysis</th>
                    <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Skill & Abilities</th>
                    <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.paths.map((path: { name: string; roles: string; psyScore: number; skillScore: number; comment: string }, pi: number) => {
                    const commentColor =
                      path.comment === "Top Choice"
                        ? RED
                        : path.comment === "Good Choice"
                          ? "#16a34a"
                          : path.comment === "Avoid"
                            ? RED
                            : GRAY;
                    const psyLabel =
                      path.psyScore >= 78
                        ? "Very High"
                        : path.psyScore >= 65
                          ? "High"
                          : path.psyScore >= 50
                            ? "Average"
                            : "Low";
                    const skLabel =
                      path.skillScore >= 80
                        ? "Very High"
                        : path.skillScore >= 68
                          ? "High"
                          : "Average";
                    return (
                      <tr key={pi} style={{ backgroundColor: pi % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb" }}>
                          <div style={{ fontWeight: 700, color: "#1f2937" }}>{path.name}</div>
                          <div style={{ color: "#9ca3af", fontSize: 10 }}>{path.roles}</div>
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", textAlign: "center", color: "#374151" }}>
                          {psyLabel}:{path.psyScore}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", textAlign: "center", color: "#374151" }}>
                          {skLabel}:{path.skillScore}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e5e7eb",
                            textAlign: "center",
                            fontWeight: 700,
                            color: commentColor,
                          }}
                        >
                          {path.comment}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 21: CAREER PATHS — CLUSTER 2
        ══════════════════════════════════════════ */}
        <Page pageNum={21} title="Your Career Paths — Cluster 2">
          {clusterP2.map((cluster) => (
            <div key={cluster.name} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#fff",
                  padding: "8px 16px",
                  marginBottom: 8,
                  borderRadius: 4,
                  backgroundColor: DARK,
                }}
              >
                {cluster.name}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ backgroundColor: "#374151", color: "#fff" }}>
                    <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, width: "40%" }}>Career Paths</th>
                    <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Psy. Analysis</th>
                    <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Skill & Abilities</th>
                    <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.paths.map((path: { name: string; roles: string; psyScore: number; skillScore: number; comment: string }, pi: number) => {
                    const commentColor =
                      path.comment === "Top Choice"
                        ? RED
                        : path.comment === "Good Choice"
                          ? "#16a34a"
                          : path.comment === "Avoid"
                            ? RED
                            : GRAY;
                    const psyLabel =
                      path.psyScore >= 78
                        ? "Very High"
                        : path.psyScore >= 65
                          ? "High"
                          : path.psyScore >= 50
                            ? "Average"
                            : "Low";
                    const skLabel =
                      path.skillScore >= 80
                        ? "Very High"
                        : path.skillScore >= 68
                          ? "High"
                          : "Average";
                    return (
                      <tr key={pi} style={{ backgroundColor: pi % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb" }}>
                          <div style={{ fontWeight: 700, color: "#1f2937" }}>{path.name}</div>
                          <div style={{ color: "#9ca3af", fontSize: 10 }}>{path.roles}</div>
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", textAlign: "center", color: "#374151" }}>
                          {psyLabel}:{path.psyScore}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", textAlign: "center", color: "#374151" }}>
                          {skLabel}:{path.skillScore}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e5e7eb",
                            textAlign: "center",
                            fontWeight: 700,
                            color: commentColor,
                          }}
                        >
                          {path.comment}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 22: FAVOURITE CAREER PATH
        ══════════════════════════════════════════ */}
        <Page pageNum={22} title={`Your Favourite Career Path: ${favouritePath}`}>
          {topClusters.flatMap((c) =>
            c.paths
              .filter((p: { name: string }) => p.name === favouritePath)
              .map((p: { name: string; roles: string; psyScore: number; skillScore: number; comment: string }) => (
                <div key={p.name} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#fff",
                      padding: "8px 16px",
                      marginBottom: 8,
                      borderRadius: 4,
                      backgroundColor: DARK,
                    }}
                  >
                    Career Cluster: {c.name}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: "#374151", color: "#fff" }}>
                        <th style={{ padding: "8px", textAlign: "left", fontWeight: 600 }}>Career Path</th>
                        <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Psy. Analysis</th>
                        <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Skill & Abilities</th>
                        <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ backgroundColor: "#fff" }}>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", fontWeight: 700 }}>
                          {p.name}
                          <div style={{ color: "#9ca3af", fontWeight: 400, fontSize: 10 }}>{p.roles}</div>
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                          {p.psyScore >= 65 ? "High" : "Average"}:{p.psyScore}%
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                          {p.skillScore >= 70 ? "High" : "Average"}:{p.skillScore}%
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e5e7eb",
                            textAlign: "center",
                            fontWeight: 700,
                            color: p.comment === "Top Choice" ? RED : p.comment === "Good Choice" ? "#16a34a" : GRAY,
                          }}
                        >
                          {p.comment}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))
          )}
          <div
            style={{
              padding: 16,
              backgroundColor: "#1f2937",
              borderRadius: 8,
              color: "#fff",
              display: "flex",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: RED, lineHeight: 1 }}>★</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Top Choice</div>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{favouritePath}</p>
              <p style={{ fontSize: 11, color: "#d1d5db", lineHeight: 1.6 }}>
                Based on your psychometric profile, interest alignment, emotional intelligence and skills assessment, <strong style={{ color: "#fff" }}>{favouritePath}</strong> is your most recommended career path.
              </p>
            </div>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 23: CAREER PATH SCENARIOS
        ══════════════════════════════════════════ */}
        <Page pageNum={23} title="Career Path Scenarios — How to Read This Report">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            The following scenarios explain what each comment in the Career Paths table means. Use these to understand your career suitability:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["1. Top Choice", RED, "★", "You have the highest degree of interest and skills to pursue this career path. You will excel in the fields mapped to this career path."],
              ["2. Good Choice", "#16a34a", "✓", "This Career path will be a good match for you as your interest and skills & abilities are correctly aligned."],
              ["3. Optional", "#3b82f6", "◐", "You have adequate interest level and skills & abilities to pursue this career path. However, this can be pursued if you are not pursuing your top or good choice."],
              ["4. Develop", "#f59e0b", "▲", "Developing the skills and abilities required for this career path can increase your probability of success."],
              ["5. Explore", "#8b5cf6", "◈", "Explore options where you have higher interest and skills and abilities than this career path."],
              ["6. Avoid", "#6b7280", "✗", "You either have very less skills & abilities or very less interest in this career path. In both cases, it is suggested to avoid this career path."],
            ].map(([label, color, icon, desc]) => (
              <div
                key={label as string}
                style={{
                  display: "flex",
                  gap: 14,
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "12px 16px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: color as string,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: color as string, marginBottom: 4 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 24: CAREER ANALYSIS POSITIVE
        ══════════════════════════════════════════ */}
        <Page pageNum={24} title="Career Analysis — Positive (+)">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            The following strengths emerged from your assessment and will support your success in your chosen career path:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {strengthsBullets.map((b: string, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 14px",
                  backgroundColor: i % 2 === 0 ? "#fff7f7" : "#f9fafb",
                  borderRadius: 6,
                  border: "1px solid #fde8e8",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: RED,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  +
                </div>
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{b}</p>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 25: GAP ANALYSIS NEGATIVE
        ══════════════════════════════════════════ */}
        <Page pageNum={25} title="Gap Analysis — Negative (-)">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            The gap analysis identifies areas where development is needed to achieve your career aspirations. These are opportunities for growth:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gapBullets.map((b: string, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 14px",
                  backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#374151",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  △
                </div>
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{b}</p>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 26: SKILL STRENGTH
        ══════════════════════════════════════════ */}
        <Page pageNum={26} title="Your Skill and Abilities Strength">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            The following skills are your key strengths that will support your career journey in{" "}
            <strong>{favouritePath}</strong>:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {skills
              .filter((s: { pct: number }) => s.pct >= 65)
              .map((s: { name: string; pct: number; label: string }) => (
                <div
                  key={s.name}
                  style={{
                    padding: "12px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: s.pct >= 75 ? RED : DARK,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {s.pct}%
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: "#6b7280" }}>Your {s.name} are {s.label}</p>
                  </div>
                </div>
              ))}
          </div>
          <div style={{ padding: 14, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 6 }}>
              Skills Development Recommendation
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>
              Build on your strong skills while systematically addressing gaps. Focus on practical projects, certifications and mentorship to accelerate your development in {favouritePath}.
            </p>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 27: WORK NATURE
        ══════════════════════════════════════════ */}
        <Page pageNum={27} title={`Work Nature: ${favouritePath}`}>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            As a <strong>{favouritePath}</strong> professional, your day-to-day responsibilities will include domain-specific work in your chosen field. The following skills define what you will be doing day to day:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pathSkills.slice(0, 8).map((sk: { name: string; sub: string; pct: number }) => (
              <div
                key={sk.name}
                style={{
                  padding: "10px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  backgroundColor: "#fff",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: "100%",
                    minHeight: 32,
                    backgroundColor: RED,
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1f2937", marginBottom: 2 }}>
                    {sk.name}
                  </p>
                  <p style={{ fontSize: 11, color: "#6b7280" }}>{sk.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 28: EDUCATION ROADMAP
        ══════════════════════════════════════════ */}
        <Page pageNum={28} title={`Your Education Road Map: ${favouritePath}`}>
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            The Education road map will give you a clear idea of subjects that you should choose at a different level of your career path.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ backgroundColor: "#374151", color: "#fff" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, width: "14%" }}>Stages</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, width: "14%" }}>Subjects</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, width: "40%" }}>Education Subjects</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 600 }}>Occupations</th>
              </tr>
            </thead>
            <tbody>
              {eduRoadmap.stages.map(
                (
                  row: { stage: string; subject: string; courses: string[]; occupations?: string[] },
                  ri: number
                ) => (
                  <tr
                    key={ri}
                    style={{
                      backgroundColor: ri % 2 === 0 ? DARK : "#374151",
                      color: "#ccc",
                      verticalAlign: "top",
                    }}
                  >
                    <td style={{ padding: "8px", border: "1px solid #4b5563", fontWeight: 600 }}>
                      {row.stage}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #4b5563", fontWeight: 600 }}>
                      {row.subject}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #4b5563" }}>
                      {row.courses.map((c: string, ci: number) => (
                        <div key={ci} style={{ marginBottom: 2 }}>• {c}</div>
                      ))}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #4b5563" }}>
                      {row.occupations?.map((o: string, oi: number) => (
                        <div key={oi} style={{ marginBottom: 2 }}>• {o}</div>
                      ))}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 29: SALARY
        ══════════════════════════════════════════ */}
        <Page pageNum={29} title={`${favouritePath} — Salary in 2025`}>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: 200,
                padding: "0 16px",
              }}
            >
              {salary.map((s: { amount: string; level: string }, i: number) => {
                const amounts = salary.map((x: { amount: string }) =>
                  parseInt(x.amount.replace(/[₹,\s]/g, ""))
                );
                const max = Math.max(...amounts);
                const val = parseInt(s.amount.replace(/[₹,\s]/g, ""));
                const h = Math.round((val / max) * 160);
                const colors = [RED, DARK, "#6b7280", "#374151", "#16a34a"];
                return (
                  <div
                    key={i}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: colors[i] }}>
                      {s.amount}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        borderRadius: "6px 6px 0 0",
                        height: `${h}px`,
                        backgroundColor: colors[i],
                      }}
                    />
                    <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center", marginTop: 6, lineHeight: 1.3 }}>
                      {s.level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: "#374151", color: "#fff" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Level</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Annual Salary</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Currency</th>
              </tr>
            </thead>
            <tbody>
              {salary.map((s: { amount: string; level: string }, i: number) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                  <td style={{ padding: "10px 12px", border: "1px solid #e5e7eb" }}>{s.level}</td>
                  <td style={{ padding: "10px 12px", border: "1px solid #e5e7eb", fontWeight: 700, color: RED }}>
                    ▲ {s.amount}
                  </td>
                  <td style={{ padding: "10px 12px", border: "1px solid #e5e7eb" }}>INR</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              marginTop: 16,
              padding: 14,
              backgroundColor: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>
              <strong style={{ color: DARK }}>Note:</strong> Salary figures are approximate and based on 2025 market data for India. Actual compensation varies by company, location, experience and specialization.
            </p>
          </div>
        </Page>

        {/* ══════════════════════════════════════════
            PAGE 30: CAREER ASSESSMENT SUMMARY
        ══════════════════════════════════════════ */}
        <Page pageNum={30} title="Career Assessment Summary — Correlation Theory">
          <p style={{ fontSize: 12, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
            Our Career Assessment is based on Correlation Theory — all dimensions of your profile are measured together to identify the most suitable career paths for you.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 20 }}>
            <tbody>
              {[
                ["Career Personality", mbti.typeLabel.split(" · ").join(" + ")],
                ["Career Interest", interests.slice(0, 3).map((i: { name: string }) => i.name).join(" + ")],
                ["Career Motivator", topMotivators.join(" + ")],
                ["Learning Style", dominantLearning + " learning"],
                ["EQ", eq.filter((e: { level: string }) => e.level === "High").map((e: { name: string }) => e.name).join(" + ") || eq[0].name],
                ["Skills & Abilities", skills.map((s: { name: string; pct: number }) => `${s.name} [${s.pct}%]`).join(" + ")],
                ["Selected Clusters", topClusters.map((c: { name: string }) => c.name).join(" + ")],
                ["Favourite Career Path", favouritePath],
              ].map(([label, val], i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? DARK : "#374151", color: "#ccc" }}>
                  <td
                    style={{
                      padding: "10px 14px",
                      border: "1px solid #4b5563",
                      fontWeight: 700,
                      color: "#fff",
                      width: 180,
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: "10px 14px", border: "1px solid #4b5563" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Path skills grid */}
          <div
            style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#fff",
              padding: "8px 16px",
              marginBottom: 12,
              borderRadius: 4,
              backgroundColor: DARK,
            }}
          >
            Skills That Affect {favouritePath}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {pathSkills.map((sk: { name: string; pct: number; sub: string }) => (
              <div
                key={sk.name}
                style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 12, color: RED }}>{sk.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: RED }}>▲ {sk.pct}%</span>
                </div>
                <p style={{ fontSize: 10, color: "#6b7280" }}>{sk.sub}</p>
              </div>
            ))}
          </div>
        </Page>

      </div>
    </div>
  );
}

// ─── Page export with Suspense ────────────────────────────────
export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReportInner />
    </Suspense>
  );
}