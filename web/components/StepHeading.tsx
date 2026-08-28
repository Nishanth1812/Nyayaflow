type StepHeadingProps = {
  eyebrow: string;
  title: string;
  intro: string;
};

export function StepHeading({ eyebrow, title, intro }: StepHeadingProps) {
  return (
    <div className="mb-7">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-teal">{eyebrow}</p>
      <h1 className="mt-2 max-w-lg text-2xl font-bold leading-tight tracking-[-0.01em] text-ink sm:text-[1.85rem]">{title}</h1>
      <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-ink/65">{intro}</p>
    </div>
  );
}
