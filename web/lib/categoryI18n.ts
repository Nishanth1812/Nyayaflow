import type { Locale } from "./i18n";
import type { Category } from "./mockApi";

export type CategoryPickerCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  stage: string;
  cards: { category: Category; title: string; description: string }[];
};

export const categoryPickerDictionaries: Record<Locale, CategoryPickerCopy> = {
  en: {
    eyebrow: "Choose an issue",
    title: "What's the problem?",
    intro: "Choose the issue you want help with. We'll ask a few simple questions next.",
    stage: "Choose",
    cards: [
      { category: "pm_kisan_payment_failure", title: "PM-KISAN payment stopped", description: "An instalment was approved before, but has not reached you." },
      { category: "epfo_claim_rejected", title: "EPFO PF claim rejected", description: "Your provident-fund withdrawal or transfer claim was rejected." },
      { category: "income_tax_refund_delayed", title: "Income tax refund delayed", description: "Your filed return is complete, but the refund has not arrived." },
      { category: "scholarship_nsp_payment_stuck", title: "Scholarship payment stuck", description: "Your scholarship application is approved, but payment is still pending." },
      { category: "nrega_wage_delayed", title: "MGNREGA wage not paid", description: "You completed work under MGNREGA, but the wage has not reached you." },
    ],
  },
  ta: {
    eyebrow: "பிரச்சினையைத் தேர்ந்தெடுக்கவும்",
    title: "என்ன பிரச்சினை?",
    intro: "உதவி தேவைப்படும் பிரச்சினையைத் தேர்ந்தெடுக்கவும். அடுத்து சில எளிய கேள்விகளைக் கேட்போம்.",
    stage: "தேர்வு",
    cards: [
      { category: "pm_kisan_payment_failure", title: "PM-KISAN பணம் நிறுத்தப்பட்டது", description: "ஒரு தவணை முன்பு வந்தது, ஆனால் இப்போது வரவில்லை." },
      { category: "epfo_claim_rejected", title: "EPFO PF கோரிக்கை நிராகரிக்கப்பட்டது", description: "உங்கள் PF பணம் பெறும் கோரிக்கை நிராகரிக்கப்பட்டது." },
      { category: "income_tax_refund_delayed", title: "வருமான வரி திருப்பித் தருவது தாமதம்", description: "வருமான வரி அறிக்கை முடிந்தது, ஆனால் பணம் வரவில்லை." },
      { category: "scholarship_nsp_payment_stuck", title: "கல்வி உதவித்தொகை பணம் நிலுவை", description: "உங்கள் விண்ணப்பம் ஏற்கப்பட்டது, ஆனால் பணம் வரவில்லை." },
      { category: "nrega_wage_delayed", title: "MGNREGA ஊதியம் வரவில்லை", description: "MGNREGA பணிக்கு நீங்கள் வேலை செய்தீர்கள், ஆனால் ஊதியம் வரவில்லை." },
    ],
  },
  hi: {
    eyebrow: "समस्या चुनें",
    title: "क्या समस्या है?",
    intro: "वह समस्या चुनें जिसमें आपको मदद चाहिए। आगे हम कुछ सीधे सवाल पूछेंगे।",
    stage: "चुनें",
    cards: [
      { category: "pm_kisan_payment_failure", title: "PM-KISAN भुगतान रुका", description: "एक किस्त पहले स्वीकृत हुई, लेकिन आप तक नहीं पहुँची।" },
      { category: "epfo_claim_rejected", title: "EPFO PF दावा अस्वीकृत", description: "आपका provident fund निकासी या स्थानांतरण दावा अस्वीकृत हुआ।" },
      { category: "income_tax_refund_delayed", title: "आयकर रिफंड विलंबित", description: "आपका रिटर्न पूरा है, लेकिन रिफंड नहीं आया।" },
      { category: "scholarship_nsp_payment_stuck", title: "छात्रवृत्ति भुगतान अटका", description: "आपका छात्रवृत्ति आवेदन स्वीकृत है, लेकिन भुगतान बाकी है।" },
      { category: "nrega_wage_delayed", title: "MGNREGA मज़दूरी नहीं मिली", description: "आपने MGNREGA के तहत काम किया, लेकिन मज़दूरी आप तक नहीं पहुँची।" },
    ],
  },
};
