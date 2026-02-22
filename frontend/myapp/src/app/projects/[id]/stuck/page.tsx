"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── Placeholder data (replace with backend integration later) ────────────────
interface BranchNode {
    id: string;
    emoji: string;
    title: string;
    preview: string;
    fullText: string;
    color: string;
    gradient: string;
    children: BranchNode[];
}

const PLACEHOLDER_STORY_EXCERPT = `Elizabeth Bennet stood at the edge of the Netherfield ballroom, her pulse quickening as Mr. Darcy crossed the room toward her. The music swelled around them — violins, a pianoforte — yet she could hear nothing but the echo of his words at the Meryton assembly: "She is tolerable, but not handsome enough to tempt me." She had resolved to despise him, and yet here he stood, extending his hand with an expression she could not decipher. Behind them, her mother's shrill laughter rose above the crowd, and Jane's gentle smile faltered as Mr. Bingley turned away. Everything was unraveling, and Elizabeth did not know whose thread to pull first.`;

const BRANCHES: BranchNode[] = [
    {
        id: "b1",
        emoji: "🔥",
        title: "Darcy's Confession",
        preview: "Mr. Darcy breaks convention and confesses his feelings to Elizabeth right there on the ballroom floor, shocking all of Hertfordshire...",
        fullText: "Darcy did not wait for the dance to end. He stepped closer than propriety allowed, his voice low and urgent against the swell of the music. 'Miss Bennet, I have struggled in vain. I can bear it no longer. You must allow me to tell you how ardently I admire and love you.' The words fell like a thunderclap. Mrs. Bennet's fan stopped mid-flutter. Caroline Bingley's smile froze into porcelain. Elizabeth felt the blood drain from her face — not because she was shocked by the confession, but because she realized, with a terrible clarity, that some part of her had been waiting for it. 'You have chosen a curious venue for such a declaration, Mr. Darcy,' she managed, though her voice trembled.",
        color: "#dc2626",
        gradient: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.02))",
        children: [
            { id: "b1-1", emoji: "💔", title: "Elizabeth Refuses", preview: "Elizabeth, still blinded by pride, delivers a cutting refusal that fractures Darcy's composure entirely...", fullText: "", color: "#dc2626", gradient: "", children: [] },
            { id: "b1-2", emoji: "💌", title: "The Letter Arrives Early", preview: "Darcy thrusts a letter into her hands before she can refuse — revealing Wickham's true nature immediately...", fullText: "", color: "#dc2626", gradient: "", children: [] },
            { id: "b1-3", emoji: "👀", title: "Lady Catherine Intervenes", preview: "Lady Catherine de Bourgh arrives unannounced at the ball, having heard rumors of her nephew's attachment...", fullText: "", color: "#dc2626", gradient: "", children: [] },
        ],
    },
    {
        id: "b2",
        emoji: "💕",
        title: "Jane & Bingley's Crisis",
        preview: "Mr. Bingley suddenly announces he is leaving Netherfield for London, and Jane must decide whether to fight for love or preserve her dignity...",
        fullText: "It was Jane who broke first. When Mr. Bingley bowed stiffly and announced his departure for London — 'business matters, you understand' — her composure held for precisely three seconds. Then Elizabeth saw what no one else did: the slight tremor in Jane's lower lip, the way her fingers crushed the silk of her glove. Later, in the carriage home, Jane whispered what Elizabeth had always known but never heard her sister say aloud: 'I love him, Lizzy. I love him and I am losing him, and I do not know how to bear it.' Elizabeth took her sister's hand and made a silent vow. She would go to London. She would find Bingley. And she would discover exactly who had poisoned his mind against the sweetest woman in all of England.",
        color: "#e11d7e",
        gradient: "linear-gradient(135deg, rgba(225,29,126,0.08), rgba(225,29,126,0.02))",
        children: [
            { id: "b2-1", emoji: "🏙️", title: "Elizabeth Goes to London", preview: "Elizabeth travels to Cheapside and uncovers Miss Bingley's scheme to keep Jane and Bingley apart...", fullText: "", color: "#e11d7e", gradient: "", children: [] },
            { id: "b2-2", emoji: "✉️", title: "Jane's Bold Letter", preview: "Jane writes directly to Bingley against all convention, pouring out her feelings in ink and candlelight...", fullText: "", color: "#e11d7e", gradient: "", children: [] },
            { id: "b2-3", emoji: "🤝", title: "Mr. Bennet Steps In", preview: "For once, Mr. Bennet emerges from his library and confronts Bingley man-to-man at his London club...", fullText: "", color: "#e11d7e", gradient: "", children: [] },
        ],
    },
    {
        id: "b3",
        emoji: "🕵️",
        title: "Wickham's Dark Secret",
        preview: "A mysterious letter surfaces revealing that Wickham's debts and deceptions run far deeper than anyone suspected — threatening the entire Bennet family...",
        fullText: "Colonel Fitzwilliam arrived at Longbourn unannounced, rain-soaked and grim. He carried a leather folio bound with military seals — documents Wickham had never intended anyone to find. 'Miss Bennet,' he said to Elizabeth, 'what I am about to show you will change your understanding of every person in this room.' The papers told a story of forged debts, ruined merchants, and three young women in three different counties who had all been promised the same future by the same charming officer. But the final document was the worst: a letter in Wickham's own hand, outlining a calculated plan to elope with Georgiana Darcy — not for love, but to extort thirty thousand pounds from her brother. And there was a new name on his list now. Lydia Bennet.",
        color: "#7c3aed",
        gradient: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))",
        children: [
            { id: "b3-1", emoji: "⚔️", title: "Darcy Challenges Wickham", preview: "Armed with proof, Darcy confronts Wickham at the officers' mess, and honour demands satisfaction...", fullText: "", color: "#7c3aed", gradient: "", children: [] },
            { id: "b3-2", emoji: "🏃‍♀️", title: "Lydia Elopes Early", preview: "Before anyone can act, Lydia runs away with Wickham from the Brighton camp, plunging the Bennets into scandal...", fullText: "", color: "#7c3aed", gradient: "", children: [] },
            { id: "b3-3", emoji: "📜", title: "Elizabeth Exposes Him", preview: "Elizabeth publishes the evidence in the county gazette, risking her own reputation to save others from Wickham...", fullText: "", color: "#7c3aed", gradient: "", children: [] },
        ],
    },
    {
        id: "b4",
        emoji: "🌊",
        title: "Elizabeth's Inner Journey",
        preview: "Elizabeth retreats to the solitude of Pemberley's grounds and confronts her own prejudice — realizing she may have misjudged not only Darcy, but herself...",
        fullText: "The invitation to tour Pemberley came from the Gardiners, and Elizabeth accepted only because she was assured its master was away. But standing in the portrait gallery, gazing up at Darcy's likeness — those eyes rendered in oil paint with the same intensity they held in life — she felt something crack inside her careful architecture of contempt. The housekeeper, Mrs. Reynolds, spoke of him with such genuine warmth: 'He is the best landlord, and the best master that ever lived. There is not one of his tenants or servants but will give him a good name.' Elizabeth pressed her palm against the cool marble of the mantelpiece and asked herself the question she had been avoiding for months: What if I was wrong? What if my pride was the mirror image of his, and I have been too blind to see my own reflection?",
        color: "#0891b2",
        gradient: "linear-gradient(135deg, rgba(8,145,178,0.08), rgba(8,145,178,0.02))",
        children: [
            { id: "b4-1", emoji: "🏛️", title: "The Pemberley Encounter", preview: "Darcy returns unexpectedly and finds Elizabeth in his own gallery — their eyes meet across the silence of a hundred portraits...", fullText: "", color: "#0891b2", gradient: "", children: [] },
            { id: "b4-2", emoji: "📖", title: "Elizabeth's Journal", preview: "Elizabeth begins writing a journal, re-examining every interaction with Darcy, and the truth slowly emerges from her own words...", fullText: "", color: "#0891b2", gradient: "", children: [] },
            { id: "b4-3", emoji: "🌿", title: "The Garden Conversation", preview: "A chance meeting with Georgiana Darcy in the gardens reveals a side of Darcy that Elizabeth never imagined possible...", fullText: "", color: "#0891b2", gradient: "", children: [] },
        ],
    },
];

// ─── SVG Connector Lines Component ────────────────────────────────────────────
function ConnectorLine({ x1, y1, x2, y2, color, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; color: string; delay?: number }) {
    const midY = (y1 + y2) / 2;
    const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    return (
        <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.4"
            style={{ animation: `drawLine 0.8s ease ${delay}s both` }}
        />
    );
}

// ─── Branch Card Component ────────────────────────────────────────────────────
function BranchCard({
    branch,
    isExpanded,
    isOtherExpanded,
    onClick,
    onSelect,
    index,
}: {
    branch: BranchNode;
    isExpanded: boolean;
    isOtherExpanded: boolean;
    onClick: () => void;
    onSelect: (branch: BranchNode) => void;
    index: number;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: isOtherExpanded ? 0.3 : 1,
                transform: isOtherExpanded ? "scale(0.92)" : "scale(1)",
                pointerEvents: isOtherExpanded ? "none" : "auto",
                filter: isOtherExpanded ? "blur(2px)" : "none",
                animation: `fadeSlideUp 0.6s ease ${0.15 * index}s both`,
            }}
        >
            {/* Main card */}
            <div
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: isExpanded ? "340px" : "280px",
                    padding: isExpanded ? "1.5rem" : "1.25rem",
                    borderRadius: "20px",
                    background: isExpanded
                        ? `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`
                        : hovered
                            ? "rgba(255,255,255,0.92)"
                            : "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(20px)",
                    border: isExpanded
                        ? `2px solid ${branch.color}40`
                        : hovered
                            ? `1.5px solid ${branch.color}30`
                            : "1.5px solid rgba(232,226,217,0.6)",
                    boxShadow: isExpanded
                        ? `0 20px 60px ${branch.color}15, 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)`
                        : hovered
                            ? `0 12px 40px ${branch.color}12, 0 4px 16px rgba(0,0,0,0.06)`
                            : "0 4px 20px rgba(0,0,0,0.04), 0 1px 6px rgba(0,0,0,0.02)",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: hovered && !isExpanded ? "translateY(-6px) scale(1.02)" : "translateY(0)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Glow accent bar */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: `linear-gradient(90deg, transparent, ${branch.color}, transparent)`,
                    opacity: isExpanded || hovered ? 1 : 0,
                    transition: "opacity 0.3s",
                }} />

                {/* Emoji + Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                    <span style={{
                        fontSize: "1.5rem",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "12px",
                        background: branch.gradient || `${branch.color}10`,
                    }}>
                        {branch.emoji}
                    </span>
                    <div>
                        <h3 style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "1.05rem",
                            color: "#1a1510",
                            margin: 0,
                            fontWeight: "normal",
                        }}>
                            {branch.title}
                        </h3>
                        <span style={{
                            fontSize: "0.68rem",
                            color: branch.color,
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                        }}>
                            {isExpanded ? "▼ Expanded" : "Click to explore →"}
                        </span>
                    </div>
                </div>

                {/* Preview text */}
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.82rem",
                    lineHeight: 1.6,
                    color: "#5a5550",
                    margin: 0,
                }}>
                    {branch.preview}
                </p>

                {/* Full text when expanded */}
                {isExpanded && (
                    <div style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        borderRadius: "12px",
                        background: "rgba(250,247,244,0.6)",
                        border: "1px solid rgba(232,226,217,0.5)",
                        animation: "fadeSlideUp 0.4s ease both",
                    }}>
                        <p style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "0.88rem",
                            lineHeight: 1.8,
                            color: "#1a1510",
                            margin: 0,
                        }}>
                            {branch.fullText}
                        </p>
                    </div>
                )}

                {/* Select button when expanded */}
                {isExpanded && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(branch); }}
                        style={{
                            marginTop: "0.75rem",
                            width: "100%",
                            padding: "0.6rem",
                            borderRadius: "10px",
                            border: "none",
                            background: branch.color,
                            color: "#fff",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            animation: "fadeSlideUp 0.3s ease 0.2s both",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = `0 4px 16px ${branch.color}40`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                        ✨ Compare This Path
                    </button>
                )}
            </div>

            {/* Sub-branches when expanded */}
            {isExpanded && branch.children.length > 0 && (
                <div style={{
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    maxWidth: "600px",
                }}>
                    {branch.children.map((child, i) => (
                        <div
                            key={child.id}
                            style={{
                                width: "170px",
                                padding: "0.9rem",
                                borderRadius: "14px",
                                background: "rgba(255,255,255,0.8)",
                                backdropFilter: "blur(12px)",
                                border: `1.5px solid ${branch.color}20`,
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                animation: `fadeSlideUp 0.4s ease ${0.1 * (i + 1)}s both`,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-3px)";
                                e.currentTarget.style.borderColor = `${branch.color}50`;
                                e.currentTarget.style.boxShadow = `0 8px 24px ${branch.color}12`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.borderColor = `${branch.color}20`;
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <span style={{ fontSize: "1.2rem" }}>{child.emoji}</span>
                            <h4 style={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: "0.82rem",
                                color: "#1a1510",
                                margin: "0.4rem 0 0.3rem",
                                fontWeight: "normal",
                            }}>
                                {child.title}
                            </h4>
                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.72rem",
                                lineHeight: 1.5,
                                color: "#7a756e",
                                margin: 0,
                            }}>
                                {child.preview}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Comparison Panel ─────────────────────────────────────────────────────────
function ComparisonPanel({
    selectedBranch,
    storyExcerpt,
}: {
    selectedBranch: BranchNode | null;
    storyExcerpt: string;
}) {
    const [activeTab, setActiveTab] = useState<"split" | "current" | "new">("split");

    if (!selectedBranch) return null;

    return (
        <div style={{
            animation: "fadeSlideUp 0.5s ease both",
            marginTop: "2rem",
        }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: `linear-gradient(135deg, ${selectedBranch.color}15, ${selectedBranch.color}05)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                }}>
                    ⚖️
                </div>
                <div>
                    <h3 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: "1.2rem",
                        color: "#1a1510",
                        margin: 0,
                    }}>
                        Story Comparison
                    </h3>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.75rem",
                        color: "#9e9589",
                        margin: 0,
                    }}>
                        See how <strong style={{ color: selectedBranch.color }}>{selectedBranch.title}</strong> continues your story
                    </p>
                </div>
            </div>

            {/* Tab bar */}
            <div style={{
                display: "flex",
                gap: "0.25rem",
                padding: "4px",
                borderRadius: "12px",
                background: "rgba(232,226,217,0.3)",
                marginBottom: "1rem",
                width: "fit-content",
            }}>
                {([
                    { key: "split" as const, label: "Side by Side" },
                    { key: "current" as const, label: "Current Story" },
                    { key: "new" as const, label: "New Path" },
                ]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: "0.45rem 1rem",
                            borderRadius: "9px",
                            border: "none",
                            background: activeTab === tab.key ? "#fff" : "transparent",
                            boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                            color: activeTab === tab.key ? "#1a1510" : "#9e9589",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.78rem",
                            fontWeight: activeTab === tab.key ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Comparison content */}
            <div style={{
                display: "flex",
                gap: "1rem",
                borderRadius: "16px",
                overflow: "hidden",
            }}>
                {/* Current story */}
                {(activeTab === "split" || activeTab === "current") && (
                    <div style={{
                        flex: 1,
                        padding: "1.5rem",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(12px)",
                        border: "1.5px solid rgba(232,226,217,0.5)",
                        animation: "fadeSlideUp 0.3s ease both",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <div style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#9e9589",
                            }} />
                            <span style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: "#9e9589",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}>
                                Current Story
                            </span>
                        </div>
                        <p style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "0.9rem",
                            lineHeight: 1.85,
                            color: "#4a4540",
                            margin: 0,
                        }}>
                            {storyExcerpt}
                        </p>
                    </div>
                )}

                {/* Arrow / divider */}
                {activeTab === "split" && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0 0.25rem",
                    }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${selectedBranch.color}, ${selectedBranch.color}CC)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "0.9rem",
                            boxShadow: `0 4px 16px ${selectedBranch.color}30`,
                        }}>
                            →
                        </div>
                    </div>
                )}

                {/* New path */}
                {(activeTab === "split" || activeTab === "new") && (
                    <div style={{
                        flex: 1,
                        padding: "1.5rem",
                        borderRadius: "16px",
                        background: `linear-gradient(135deg, rgba(255,255,255,0.85), ${selectedBranch.color}08)`,
                        backdropFilter: "blur(12px)",
                        border: `1.5px solid ${selectedBranch.color}25`,
                        animation: "fadeSlideUp 0.3s ease 0.1s both",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <div style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: selectedBranch.color,
                                boxShadow: `0 0 8px ${selectedBranch.color}50`,
                            }} />
                            <span style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: selectedBranch.color,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}>
                                {selectedBranch.emoji} {selectedBranch.title}
                            </span>
                        </div>
                        <p style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "0.9rem",
                            lineHeight: 1.85,
                            color: "#1a1510",
                            margin: 0,
                        }}>
                            {selectedBranch.fullText}
                        </p>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1.25rem",
                justifyContent: "flex-end",
                animation: "fadeSlideUp 0.4s ease 0.3s both",
            }}>
                <button
                    style={{
                        padding: "0.55rem 1.25rem",
                        borderRadius: "10px",
                        border: "1.5px solid #e8e2d9",
                        background: "rgba(255,255,255,0.7)",
                        color: "#4a4540",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#9e9589"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; }}
                >
                    ↻ Try Another Path
                </button>
                <button
                    style={{
                        padding: "0.55rem 1.25rem",
                        borderRadius: "10px",
                        border: "none",
                        background: `linear-gradient(135deg, #047857, #065f46)`,
                        color: "#fff",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 4px 16px rgba(4,120,87,0.25)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(4,120,87,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(4,120,87,0.25)"; }}
                >
                    ✨ Apply This Path
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Page ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function StuckPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<BranchNode | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const handleCardClick = (branchId: string) => {
        setExpandedId(prev => prev === branchId ? null : branchId);
        if (expandedId === branchId) setSelectedBranch(null);
    };

    const handleSelect = (branch: BranchNode) => {
        setSelectedBranch(branch);
        // Smooth scroll to comparison
        setTimeout(() => {
            document.getElementById("comparison-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 100; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 0.4; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(4,120,87,0.15), 0 4px 12px rgba(0,0,0,0.05); }
          50% { box-shadow: 0 0 30px rgba(4,120,87,0.25), 0 4px 12px rgba(0,0,0,0.05); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }

        .stuck-page-bg {
          min-height: 100vh;
          background: linear-gradient(180deg, #fef6ee 0%, #fdf0e2 30%, #fef6ee 70%, #fceee0 100%);
          position: relative;
          overflow-x: hidden;
        }

        .orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          animation: floatOrb 20s ease-in-out infinite;
        }
      `}</style>

            <div className="stuck-page-bg">
                {/* Ambient floating orbs */}
                <div className="orb" style={{ width: "400px", height: "400px", background: "rgba(4,120,87,0.06)", top: "-100px", right: "-100px", animationDelay: "0s" }} />
                <div className="orb" style={{ width: "300px", height: "300px", background: "rgba(201,140,80,0.05)", bottom: "10%", left: "-80px", animationDelay: "-7s" }} />
                <div className="orb" style={{ width: "250px", height: "250px", background: "rgba(124,58,237,0.04)", top: "40%", right: "10%", animationDelay: "-13s" }} />

                {/* ── Top Nav ── */}
                <nav style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 2rem",
                    height: "56px",
                    background: "rgba(254,246,238,0.85)",
                    backdropFilter: "blur(16px)",
                    borderBottom: "1px solid rgba(232,226,217,0.6)",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    gap: "0.75rem",
                }}>
                    <button
                        onClick={() => router.push(`/projects/${projectId}`)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#9e9589",
                            fontSize: "0.82rem",
                            fontFamily: "'DM Sans', sans-serif",
                            padding: "0.35rem 0.6rem",
                            borderRadius: "7px",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,235,227,0.8)"; e.currentTarget.style.color = "#1a1510"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9e9589"; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                        Back to Editor
                    </button>

                    <div style={{ width: "1px", height: "20px", background: "rgba(232,226,217,0.6)" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{
                            fontSize: "1.1rem",
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "9px",
                            background: "linear-gradient(135deg, rgba(4,120,87,0.1), rgba(4,120,87,0.03))",
                        }}>
                            🧠
                        </span>
                        <span style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "1rem",
                            color: "#1a1510",
                        }}>
                            Story Branching
                        </span>
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={{
                        padding: "0.35rem 0.9rem",
                        borderRadius: "20px",
                        background: "rgba(4,120,87,0.08)",
                        border: "1px solid rgba(4,120,87,0.15)",
                        fontSize: "0.72rem",
                        fontFamily: "'DM Sans', sans-serif",
                        color: "#047857",
                        fontWeight: 500,
                    }}>
                        ✦ AI-Powered Suggestions
                    </div>
                </nav>

                {/* ── Main Content ── */}
                <div style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "2.5rem 2rem 4rem",
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 0.6s ease",
                }}>
                    {/* Hero section */}
                    <div style={{
                        textAlign: "center",
                        marginBottom: "2.5rem",
                        animation: "fadeSlideUp 0.6s ease both",
                    }}>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.4rem 1rem",
                            borderRadius: "20px",
                            background: "rgba(255,255,255,0.6)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(232,226,217,0.5)",
                            marginBottom: "1rem",
                            fontSize: "0.75rem",
                            fontFamily: "'DM Sans', sans-serif",
                            color: "#9e9589",
                        }}>
                            <span style={{ fontSize: "0.85rem" }}>💡</span>
                            Writer&apos;s block? Explore new directions
                        </div>
                        <h1 style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "2.2rem",
                            color: "#1a1510",
                            fontWeight: "normal",
                            marginBottom: "0.5rem",
                            letterSpacing: "-0.02em",
                        }}>
                            Where Should Your Story Go?
                        </h1>
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.92rem",
                            color: "#9e9589",
                            maxWidth: "500px",
                            margin: "0 auto",
                            lineHeight: 1.6,
                        }}>
                            Click a branch to explore that direction, then compare it with your current story
                        </p>
                    </div>

                    {/* Context: Where you got stuck */}
                    <div style={{
                        maxWidth: "700px",
                        margin: "0 auto 2rem",
                        padding: "1.25rem 1.5rem",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.65)",
                        backdropFilter: "blur(16px)",
                        border: "1.5px solid rgba(232,226,217,0.5)",
                        animation: "fadeSlideUp 0.6s ease 0.1s both",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <div style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#047857",
                                boxShadow: "0 0 8px rgba(4,120,87,0.4)",
                            }} />
                            <span style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#047857",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}>
                                Where you left off
                            </span>
                        </div>
                        <p style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "0.88rem",
                            lineHeight: 1.8,
                            color: "#4a4540",
                            margin: 0,
                            fontStyle: "italic",
                        }}>
                            &ldquo;{PLACEHOLDER_STORY_EXCERPT}&rdquo;
                        </p>
                    </div>

                    {/* ── Root node ── */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0",
                        marginBottom: "1.5rem",
                    }}>
                        {/* Root node */}
                        <div style={{
                            padding: "0.8rem 1.5rem",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #047857, #065f46)",
                            color: "#fff",
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "0.92rem",
                            boxShadow: "0 8px 32px rgba(4,120,87,0.25), 0 2px 8px rgba(0,0,0,0.1)",
                            animation: "fadeSlideUp 0.5s ease 0.2s both, pulseGlow 3s ease infinite",
                            position: "relative",
                            zIndex: 2,
                        }}>
                            📖 Your Story So Far
                        </div>

                        {/* Connector trunk */}
                        <div style={{
                            width: "2px",
                            height: "40px",
                            background: "linear-gradient(180deg, #047857, rgba(4,120,87,0.2))",
                            animation: "fadeIn 0.5s ease 0.4s both",
                        }} />

                        {/* Horizontal connector bar */}
                        <div style={{
                            position: "relative",
                            height: "2px",
                            animation: "fadeIn 0.5s ease 0.5s both",
                        }}>
                            <svg
                                width="900"
                                height="50"
                                viewBox="0 0 900 50"
                                style={{
                                    position: "absolute",
                                    top: "-25px",
                                    left: "-450px",
                                    overflow: "visible",
                                    pointerEvents: "none",
                                }}
                            >
                                {/* Lines from center to each of the 4 branches */}
                                <ConnectorLine x1={450} y1={0} x2={112} y2={50} color="#dc2626" delay={0.5} />
                                <ConnectorLine x1={450} y1={0} x2={337} y2={50} color="#e11d7e" delay={0.6} />
                                <ConnectorLine x1={450} y1={0} x2={562} y2={50} color="#7c3aed" delay={0.7} />
                                <ConnectorLine x1={450} y1={0} x2={787} y2={50} color="#0891b2" delay={0.8} />
                            </svg>
                        </div>
                    </div>

                    {/* ── Branch cards ── */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: expandedId
                            ? "1fr"
                            : "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: expandedId ? "1.5rem" : "1.25rem",
                        justifyItems: "center",
                        maxWidth: expandedId ? "700px" : "1200px",
                        margin: "0 auto",
                        transition: "all 0.5s ease",
                    }}>
                        {BRANCHES.map((branch, i) => (
                            <BranchCard
                                key={branch.id}
                                branch={branch}
                                isExpanded={expandedId === branch.id}
                                isOtherExpanded={expandedId !== null && expandedId !== branch.id}
                                onClick={() => handleCardClick(branch.id)}
                                onSelect={handleSelect}
                                index={i}
                            />
                        ))}
                    </div>

                    {/* ── Comparison Panel ── */}
                    {selectedBranch && (
                        <div id="comparison-panel" style={{
                            maxWidth: "900px",
                            margin: "3rem auto 0",
                            padding: "2rem",
                            borderRadius: "24px",
                            background: "rgba(255,255,255,0.5)",
                            backdropFilter: "blur(20px)",
                            border: "1.5px solid rgba(232,226,217,0.4)",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.04)",
                        }}>
                            <ComparisonPanel
                                selectedBranch={selectedBranch}
                                storyExcerpt={PLACEHOLDER_STORY_EXCERPT}
                            />
                        </div>
                    )}

                    {/* ── Footer hint ── */}
                    <div style={{
                        textAlign: "center",
                        marginTop: "3rem",
                        animation: "fadeSlideUp 0.6s ease 1s both",
                    }}>
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.78rem",
                            color: "#b8b0a4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.4rem",
                        }}>
                            <span style={{ fontSize: "0.9rem" }}>✦</span>
                            Paths are AI-generated suggestions — your story, your choice
                            <span style={{ fontSize: "0.9rem" }}>✦</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
