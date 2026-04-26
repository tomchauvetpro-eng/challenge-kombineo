// TEMPORARY: Mentors / Membres landing page (to remove in ~1 month)
"use client";

import { useState, useMemo } from "react";
import { mentors, memberCounts, incomingMentorsByRegion } from "@/data/mentors";
import { regions, overseasTerritories } from "@/data/france-regions";
import { departmentsByRegion } from "@/data/departments";

type Tab = "mentors" | "membres";

export default function Home() {
  const [tab, setTab] = useState<Tab>("mentors");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const mentorsByRegion = useMemo(() => {
    const m: Record<string, typeof mentors> = {};
    for (const mentor of mentors) {
      (m[mentor.region] ??= []).push(mentor);
    }
    return m;
  }, []);

  const mentorCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of mentors) c[m.region] = (c[m.region] ?? 0) + 1;
    // Include incoming (newly joined) mentors in the count
    for (const [region, n] of Object.entries(incomingMentorsByRegion)) {
      c[region] = (c[region] ?? 0) + n;
    }
    return c;
  }, []);

  const totalIncoming = Object.values(incomingMentorsByRegion).reduce((a, b) => a + b, 0);
  const counts = tab === "mentors" ? mentorCounts : memberCounts;
  const total = tab === "mentors" ? mentors.length + totalIncoming : Object.values(memberCounts).reduce((a, b) => a + b, 0);

  // Color intensity based on count
  const maxCount = Math.max(...Object.values(counts));
  const getFill = (name: string) => {
    const c = counts[name] ?? 0;
    if (c === 0) return "#E8EEF4";
    const ratio = c / maxCount;
    if (ratio > 0.75) return "#1DB954";
    if (ratio > 0.5) return "#2EAA5E";
    if (ratio > 0.25) return "#5DBF80";
    return "#A8D5B5";
  };

  const selectedMentors = selected ? mentorsByRegion[selected] ?? [] : [];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F6F8] flex flex-col">
      {/* Confidential banner */}
      <div className="flex-none bg-gradient-to-r from-red-600 to-red-700 text-white text-center text-[11px] font-semibold tracking-wider uppercase py-1.5 px-4 flex items-center justify-center gap-2 shadow-sm">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Confidentiel — Ne pas partager ni communiquer ce document interne</span>
      </div>
      {/* Header with tabs */}
      <header className="flex-none px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wider uppercase text-[#0F1923]">
              L&apos;écosystème <span className="text-[#1DB954]">GreenBull MDB</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {total} {tab === "mentors" ? "mentors" : "membres"} · Répartition par région
            </p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 bg-white rounded-full p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => { setTab("mentors"); setSelected(null); }}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  tab === "mentors"
                    ? "bg-[#1DB954] text-white shadow"
                    : "text-gray-600 hover:text-[#1DB954]"
                }`}
              >
                Mentors
              </button>
              <button
                onClick={() => { setTab("membres"); setSelected(null); }}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  tab === "membres"
                    ? "bg-[#1DB954] text-white shadow"
                    : "text-gray-600 hover:text-[#1DB954]"
                }`}
              >
                Membres
              </button>
            </nav>
            <a
              href="/faq.html"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F1923] text-white text-sm font-semibold shadow-sm hover:bg-[#1DB954] transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>FAQ</span>
            </a>
          </div>
        </div>
      </header>

      {/* Map area */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-6 pb-6">
        <svg
          viewBox="0 0 600 620"
          className="max-h-full max-w-full"
          style={{ width: "auto", height: "100%" }}
        >
          {/* Metropolitan regions */}
          {regions.map((r) => {
            const count = counts[r.name] ?? 0;
            const isHovered = hovered === r.name;
            const isSelected = selected === r.name;

            // Compute region bbox width from its SVG path
            const coords = Array.from(r.path.matchAll(/[ML]([\d.]+),([\d.]+)/g));
            const xs = coords.map((m) => parseFloat(m[1]));
            const ys = coords.map((m) => parseFloat(m[2]));
            const bboxWidth = Math.max(...xs) - Math.min(...xs);
            const bboxHeight = Math.max(...ys) - Math.min(...ys);

            // Pick fontSize so text fits horizontally in ~70% of bbox width
            const maxLabelWidth = bboxWidth * 0.7;
            // Rough glyph width ≈ 0.55 * fontSize for sans-serif 600 weight
            const fitByWidth = maxLabelWidth / (r.name.length * 0.55);
            const fitByHeight = bboxHeight / 6;
            const labelFontSize = Math.max(6, Math.min(11, Math.min(fitByWidth, fitByHeight)));
            const countFontSize = Math.max(8, Math.min(13, labelFontSize * 1.2));

            return (
              <g
                key={r.id}
                onMouseEnter={() => setHovered(r.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(r.name)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={r.path}
                  fill={getFill(r.name)}
                  stroke={isHovered || isSelected ? "#1DB954" : "#ffffff"}
                  strokeWidth={isHovered || isSelected ? 3 : 1.5}
                  style={{
                    transition: "stroke 0.15s, stroke-width 0.15s, filter 0.15s",
                    filter: isHovered ? "drop-shadow(0 0 6px rgba(29,185,84,0.6))" : "none",
                  }}
                />
                <text
                  x={r.labelX}
                  y={r.labelY - labelFontSize * 0.3}
                  textAnchor="middle"
                  fontSize={labelFontSize}
                  fontWeight="600"
                  fill="#0F1923"
                  pointerEvents="none"
                >
                  {r.name}
                </text>
                <text
                  x={r.labelX}
                  y={r.labelY + countFontSize}
                  textAnchor="middle"
                  fontSize={countFontSize}
                  fontWeight="800"
                  fill="#007733"
                  pointerEvents="none"
                >
                  {count}
                </text>
              </g>
            );
          })}

          {/* Overseas territories as island silhouettes */}
          <g>
            <rect x="18" y="462" width="128" height="158" fill="rgba(255,255,255,0.4)" stroke="#D0DCE8" strokeDasharray="3,3" rx="8" />
            <text x="82" y="476" textAnchor="middle" fontSize="9" fill="#666" fontWeight="700" letterSpacing="0.5">OUTRE-MER</text>
            {overseasTerritories.map((t) => {
              const count = counts[t.name] ?? 0;
              const isHovered = hovered === t.name;
              const isSelected = selected === t.name;
              return (
                <g
                  key={t.id}
                  onMouseEnter={() => setHovered(t.name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(t.name)}
                  style={{ cursor: "pointer" }}
                >
                  <path
                    d={t.path}
                    fill={getFill(t.name)}
                    stroke={isHovered || isSelected ? "#1DB954" : "#ffffff"}
                    strokeWidth={isHovered || isSelected ? 2.5 : 1.2}
                    style={{
                      transition: "stroke 0.15s, stroke-width 0.15s, filter 0.15s",
                      filter: isHovered ? "drop-shadow(0 0 6px rgba(29,185,84,0.6))" : "none",
                    }}
                  />
                  <text x={t.labelX} y={t.labelY - 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F1923" pointerEvents="none">
                    {t.name}
                  </text>
                  <text x={t.labelX} y={t.labelY + 7} textAnchor="middle" fontSize="10" fontWeight="800" fill="#007733" pointerEvents="none">
                    {count}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </main>

      {/* Popup modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#1DB954]/10 to-transparent">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Région</div>
                <h2 className="text-xl font-bold text-[#0F1923]">{selected}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-[#1DB954]">
                    {counts[selected] ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">
                    {tab === "mentors" ? "mentor(s)" : "membre(s)"}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Popup content */}
            <div className="overflow-y-auto p-6">
              {tab === "mentors" && (incomingMentorsByRegion[selected] ?? 0) > 0 && (
                <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200">
                  <div className="flex-none w-9 h-9 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    +{incomingMentorsByRegion[selected]}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-amber-700">Nouveau</div>
                    <div className="text-sm text-amber-900">
                      {incomingMentorsByRegion[selected]} nouveau mentor a rejoint cette région.
                    </div>
                  </div>
                </div>
              )}
              {tab === "mentors" ? (
                selectedMentors.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedMentors.map((m, idx) => {
                      const initials = m.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      // Deterministic hue per mentor for variety (green family)
                      const hue = 125 + ((idx * 37) % 50) - 25;
                      return (
                        <div
                          key={m.name}
                          className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-15px_rgba(29,185,84,0.35)]"
                        >
                          {/* Diagonal gradient accent corner */}
                          <div
                            className="absolute top-0 right-0 w-32 h-32 opacity-70 pointer-events-none transition-opacity group-hover:opacity-100"
                            style={{
                              background: `radial-gradient(circle at top right, hsl(${hue},70%,55%,0.22), transparent 65%)`,
                            }}
                          />
                          {/* Card number ribbon */}
                          <div className="absolute top-0 left-0 bg-[#0F1923] text-[#1DB954] text-[9px] font-black tracking-[0.15em] px-2.5 py-1 rounded-br-xl">
                            #{String(idx + 1).padStart(2, "0")}
                          </div>

                          <div className="p-5 pt-9">
                            {/* Header: avatar + name/location */}
                            <div className="flex items-start gap-3.5 mb-4">
                              <div className="relative flex-none">
                                <div
                                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-base shadow-md"
                                  style={{
                                    background: `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${hue + 20},75%,55%))`,
                                  }}
                                >
                                  {initials}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1DB954] border-2 border-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-[#0F1923] text-[15px] leading-tight tracking-tight">
                                  {m.name}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-[#1DB954]">
                                    <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="currentColor" />
                                    <circle cx="12" cy="9" r="2.5" fill="white" />
                                  </svg>
                                  <span className="text-[11px] text-gray-500 truncate">
                                    {m.zone}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tags as metric chips */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {m.tags.map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 text-gray-700 shadow-[inset_0_-1px_0_rgba(0,0,0,0.03)]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>

                            {/* Bio */}
                            {m.bio && (
                              <div className="relative pl-3">
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-gradient-to-b from-[#1DB954] to-transparent" />
                                <p className="text-[12px] text-gray-600 leading-relaxed">
                                  {m.bio}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Hover accent line */}
                          <div className="h-[3px] bg-gradient-to-r from-transparent via-[#1DB954] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (incomingMentorsByRegion[selected] ?? 0) === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      Aucun mentor dans cette région pour l&apos;instant.
                    </div>
                  )
                )
              ) : (
                (() => {
                  const depts = departmentsByRegion[selected] ?? [];
                  // Sort departments by member count descending for clarity
                  const sorted = [...depts].sort((a, b) => b.members - a.members);
                  return (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">
                        Répartition par département ({depts.length})
                      </div>
                      {depts.length > 0 ? (
                        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                          {sorted.map((d) => (
                            <div
                              key={d.code}
                              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:border-[#1DB954] hover:shadow-sm transition"
                            >
                              <div className="flex-none w-10 h-10 rounded-full bg-[#1DB954]/10 text-[#1DB954] font-bold text-base flex items-center justify-center">
                                {d.members}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-[#0F1923] leading-tight truncate">
                                  {d.name}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {d.code} · {d.members > 1 ? "membres" : "membre"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-6">
                          Aucun département répertorié.
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
