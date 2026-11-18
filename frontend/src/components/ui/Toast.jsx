export function Toast({ toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div className={`
      fixed bottom-7 right-7 z-50 flex items-center gap-2
      px-5 py-3 rounded-xl text-sm font-medium shadow-2xl
      border transition-all
      ${isSuccess
        ? "bg-[#1f3a2a] border-[#4ade8044] text-[#4ade80]"
        : "bg-[#3a1f1f] border-[#f8717144] text-[#f87171]"}
    `}>
      {isSuccess ? "✓" : "✕"} {toast.msg}
    </div>
  );
}
