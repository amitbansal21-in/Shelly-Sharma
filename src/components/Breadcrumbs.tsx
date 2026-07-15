import React from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  items: { label: string; onClick?: () => void }[];
  onHomeClick: () => void;
}

export default function Breadcrumbs({ items, onHomeClick }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-[11px] font-mono font-medium text-[#23152B]/60 mb-6 bg-[#AD56C4]/5 py-2 px-4 rounded-full w-fit">
      <button
        onClick={onHomeClick}
        className="flex items-center space-x-1 hover:text-[#AD56C4] transition-colors duration-200 cursor-pointer"
      >
        <Home size={12} />
        <span>Home</span>
      </button>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={10} className="text-[#23152B]/30" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-[#AD56C4] transition-colors duration-200 cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#AD56C4] font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
