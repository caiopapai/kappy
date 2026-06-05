// src/features/calendar/CalendarPage.jsx
import { useState, useMemo } from "react";
import { useTranslation }       from "react-i18next";
import { useTransactionsStore } from "../../store/transactionsStore";
import { useCategoriesStore }   from "../../store/categoriesStore";

// ── Helpers ───────────────────────────────────────────────────

function daysInMonth(year, month)  { return new Date(year, month + 1, 0).getDate(); }
function firstWeekday(year, month) { return new Date(year, month, 1).getDay(); }

function recurringApplies(rule, year, month) {
  if (!rule.active) return false;
  const cell  = new Date(year, month, 1);
  const start = new Date(new Date(rule.startDate).getFullYear(), new Date(rule.startDate).getMonth(), 1);
  if (cell < start) return false;
  if (rule.endDate && !rule.hasNoEnd) {
    const end = new Date(new Date(rule.endDate).getFullYear(), new Date(rule.endDate).getMonth(), 1);
    if (cell > end) return false;
  }
  return true;
}

function eventClass(type) {
  return ["income","fixed_expense","variable_expense","investment","expense"].includes(type)
    ? type : "unknown";
}

function generateICS(events) {
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0",
    "PRODID:-//Kappy//Calendar//PT",
    "CALSCALE:GREGORIAN","METHOD:PUBLISH",
  ];
  events.forEach(ev => {
    const d = ev.date.replace(/-/g,"");
    lines.push(
      "BEGIN:VEVENT",
      `UID:kappy-${ev.id}@kappy.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g,"").slice(0,15)}Z`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${d}`,
      `SUMMARY:${ev.label}`,
      `DESCRIPTION:${ev.notes || ""}`,
      `CATEGORIES:${ev.recurring ? "Recorrente" : "Transação"}`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(events, filename) {
  const blob = new Blob([generateICS(events)], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ──────────────────────────────────────────────────────

export default function CalendarPage() {
  const { t } = useTranslation();
  const { transactions, recurringRules } = useTransactionsStore();
  const { categories, subcategories }   = useCategoriesStore();

  const WEEKDAYS = t("calendar.weekdays", { returnObjects: true });
  const MONTHS   = t("calendar.months",   { returnObjects: true });

  const now = new Date();
  const [year,  setYear]    = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [selected, setSelected] = useState(null);

  const prevMonth = () => { month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1); setSelected(null); };
  const nextMonth = () => { month === 11 ? (setYear(y=>y+1), setMonth(0))  : setMonth(m=>m+1); setSelected(null); };
  const goToday   = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(null); };

  // ── Eventos por dia ─────────────────────────────────────────

  const eventsByDay = useMemo(() => {
    const map = {};
    const add = (day, ev) => { if (!map[day]) map[day] = []; map[day].push(ev); };

    recurringRules.forEach(rule => {
      if (!recurringApplies(rule, year, month)) return;
      const day = Math.min(new Date(rule.startDate).getDate(), daysInMonth(year, month));
      const sub = subcategories.find(s => s.id === rule.subcategoryId);
      const cat = categories.find(c => c.id === sub?.categoryId);
      const label = cat && sub ? `${cat.name} · ${sub.name}` : rule.notes || sub?.name || t("calendar.recurring");
      add(day, {
        id: `r-${rule.id}`,
        label,
        type: rule.type, recurring: true,
        date: `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
        notes: rule.notes,
      });
    });

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      const sub = subcategories.find(s => s.id === tx.subcategoryId);
      const cat = categories.find(c => c.id === sub?.categoryId);
      const label = cat && sub ? `${cat.name} · ${sub.name}` : tx.description || sub?.name || "Transação";
      add(day, {
        id: `t-${tx.id}`,
        label,
        type: tx.type, recurring: false,
        date: tx.date.slice(0,10),
        notes: tx.description,
      });
    });

    return map;
  }, [year, month, transactions, recurringRules, subcategories, categories]);

  const allEvents = useMemo(() => Object.values(eventsByDay).flat(), [eventsByDay]);

  // ── Grid ────────────────────────────────────────────────────

  const total   = daysInMonth(year, month);
  const offset  = firstWeekday(year, month);
  const cells   = Array.from({ length: offset + total }, (_, i) => i < offset ? null : i - offset + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  const isPast  = (d) => new Date(year, month, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const selectedEvents = selected ? (eventsByDay[selected] || []) : [];
  const monthStr = String(month+1).padStart(2,"0");

  const LEGEND_TYPES = [
    { key: "income",           cls: "income" },
    { key: "fixed_expense",    cls: "fixed_expense" },
    { key: "variable_expense", cls: "variable_expense" },
    { key: "investment",       cls: "investment" },
  ];

  return (
    <div data-testid="calendar-page" className="cal-page">

      {/* Calendário */}
      <div className="cal-main">

        {/* Header */}
        <div className="cal-header">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <h2 className="cal-title">{MONTHS[month]} {year}</h2>
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
              <button className="cal-nav-btn" onClick={goToday}
                style={{ fontSize:10, padding:"4px 8px" }}>
                {t("calendar.today")}
              </button>
              <button className="cal-nav-btn" onClick={nextMonth}>›</button>
            </div>
          </div>
          <div className="cal-actions">
            <button className="cal-export-btn"
              onClick={() => {
                // Recorrentes do mês + transações reais — tudo num único .ics
                const recurring = recurringRules.filter(r => recurringApplies(r, year, month)).map(r => {
                  const day = Math.min(new Date(r.startDate).getDate(), daysInMonth(year, month));
                  const sub = subcategories.find(s => s.id === r.subcategoryId);
                  return { id:`r-${r.id}`, label: r.notes||sub?.name||"", type: r.type,
                    recurring:true, date:`${year}-${monthStr}-${String(day).padStart(2,"0")}`, notes: r.notes };
                });
                downloadICS([...recurring, ...allEvents.filter(e => !e.recurring)],
                  `kappy-${year}-${monthStr}.ics`);
              }}>
              📅 {t("calendar.export")}
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="cal-legend">
          {LEGEND_TYPES.map(({ key, cls }) => (
            <div key={key} className="cal-legend-item">
              <span className={`cal-event ${cls}`} style={{ width:8, height:8, padding:0, borderRadius:"50%", flexShrink:0 }} />
              {t(`calendar.legend.${key}`)}
            </div>
          ))}
          <div className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background:"var(--border-strong)", borderRadius:2 }} />
            🔄 {t("calendar.legend.recurring")}
          </div>
        </div>

        {/* Grid */}
        <div className="cal-grid">
          {/* Dias da semana */}
          <div className="cal-weekdays">
            {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
          </div>

          {/* Células */}
          <div className="cal-cells">
            {cells.map((day, i) => {
              const events   = day ? (eventsByDay[day] || []) : [];
              const isSelect = day && selected === day;
              const isTod    = day && isToday(day);
              const past     = day && isPast(day);
              const borderR  = (i+1) % 7 !== 0 ? "1px solid var(--border)" : "none";
              const borderB  = i < cells.length - 7 ? "1px solid var(--border)" : "none";

              return (
                <div
                  key={i}
                  className={`cal-cell ${!day ? "empty" : ""} ${isSelect ? "selected" : ""}`}
                  style={{ borderRight: borderR, borderBottom: borderB }}
                  onClick={() => day && setSelected(isSelect ? null : day)}
                >
                  {day && (
                    <>
                      <div className={`cal-day-num ${isTod ? "today" : ""} ${past && !isTod ? "past" : ""}`}>
                        {day}
                      </div>
                      <div className="cal-events">
                        {events.slice(0,3).map(ev => (
                          <div key={ev.id} className={`cal-event ${eventClass(ev.type)}`}>
                            {ev.recurring && <span style={{fontSize:8}}>🔄</span>}
                            {ev.label}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="cal-overflow">+{events.length-3} {t("calendar.events")}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Painel lateral */}
      {selected && (
        <div className="cal-panel">
          <div className="cal-panel-card">
            <div className="cal-panel-header">
              <div>
                <div className="cal-panel-title">{selected} de {MONTHS[month]}</div>
                <div className="cal-panel-count">
                  {selectedEvents.length} {selectedEvents.length !== 1 ? t("calendar.events") : t("calendar.event")}
                </div>
              </div>
              {selectedEvents.length > 0 && (
                <button className="cal-export-btn"
                  onClick={() => downloadICS(selectedEvents,
                    `kappy-${year}-${monthStr}-${String(selected).padStart(2,"0")}.ics`)}>
                  📅 .ics
                </button>
              )}
            </div>
            <div className="cal-panel-body">
              {selectedEvents.length === 0 ? (
                <div className="cal-panel-empty">{t("calendar.noEvents")}</div>
              ) : (
                selectedEvents.map(ev => (
                  <div key={ev.id} className={`cal-panel-event ${eventClass(ev.type)}`}>
                    {ev.recurring && (
                      <span className="cal-recurring-badge">🔄 {t("calendar.recurring")}</span>
                    )}
                    <div className={`cal-panel-event-label ${eventClass(ev.type)}`}>
                      {ev.label}
                    </div>
                    {ev.notes && ev.notes !== ev.label && (
                      <div className="cal-panel-event-notes">{ev.notes}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}