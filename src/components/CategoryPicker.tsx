import type { Dictionary } from "../lib/i18n";
import type { Category, CategoryOption } from "../lib/mockApi";
import { Icon } from "./Icons";
import { Card } from "./ui/Card";
import { StepHeading } from "./StepHeading";

type CategoryPickerCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  cards: { category: Category; title: string; description: string }[];
};

type CategoryPickerProps = {
  dictionary: Dictionary & { categoryPicker?: CategoryPickerCopy };
  options: CategoryOption[];
  onSelect: (category: Category) => void;
};

type CategoryIcon = "spark" | "shield" | "warning" | "upload" | "leaf";
const categoryIcons: Record<Category, CategoryIcon> = {
  pm_kisan_payment_failure: "spark",
  epfo_claim_rejected: "shield",
  income_tax_refund_delayed: "warning",
  scholarship_nsp_payment_stuck: "upload",
  nrega_wage_delayed: "leaf",
};

export function CategoryPicker({ dictionary, options, onSelect }: CategoryPickerProps) {
  const copy = dictionary.categoryPicker;
  return (
    <div className="mx-auto max-w-2xl">
      <StepHeading eyebrow={copy?.eyebrow ?? "Start here"} title={copy?.title ?? "What's the problem?"} intro={copy?.intro ?? "Choose the issue you want help with. We'll ask a few simple questions next."} />
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const localized = copy?.cards.find((card) => card.category === option.category);
          const title = localized?.title ?? option.title;
          const description = localized?.description ?? option.description;
          return (
            <Card
              key={option.category}
              interactive
              role="button"
              tabIndex={0}
              aria-label={title}
              onClick={() => onSelect(option.category)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(option.category);
                }
              }}
              className="flex min-h-36 cursor-pointer flex-col items-start gap-4 p-5 text-left sm:p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mist text-teal">
                <Icon name={categoryIcons[option.category]} size={24} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold leading-tight text-ink">{title}</span>
                <span className="mt-2 block text-sm font-semibold leading-5 text-ink/60">{description}</span>
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
