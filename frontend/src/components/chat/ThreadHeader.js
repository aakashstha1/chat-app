import Avatar from "@/components/ui/Avatar";

export default function ThreadHeader({ avatar, name, isAI = false, statusLine }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
      <Avatar src={avatar} name={name} isAI={isAI} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {statusLine && <p className="truncate text-xs text-muted">{statusLine}</p>}
      </div>
    </div>
  );
}
