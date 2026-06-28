import type { ReactNode } from "react";

export type LegalSection = {
  title: string;
  body: readonly string[];
};

export function LegalDocumentBody({
  sections,
  children,
}: {
  sections: readonly LegalSection[];
  children?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-[13px] font-semibold text-[#1c2530]">
            {section.title}
          </h2>
          <ul className="mt-2 space-y-2">
            {section.body.map((line) => (
              <li
                key={line}
                className="text-[12.5px] leading-relaxed text-[#5b6675]"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {children}
    </div>
  );
}
