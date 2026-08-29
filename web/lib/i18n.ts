export type Locale = "en" | "ta" | "hi";

export type Dictionary = {
  brandTagline: string;
  languageLabel: string;
  needHelp: string;
  back: string;
  continue: string;
  saveAndContinue: string;
  startOver: string;
  stages: string[];
  stageCounter: (current: number, total: number) => string;
  intake: {
    eyebrow: string;
    title: string;
    intro: string;
    assistant: string;
    complaintLabel: string;
    complaintPlaceholder: string;
    voice: string;
    voiceHint: string;
    detailsTitle: string;
    detailsHint: string;
    beneficiaryId: string;
    beneficiaryPlaceholder: string;
    state: string;
    statePlaceholder: string;
    lastPayment: string;
    required: string;
    missingDetails: string;
    missingComplaint: string;
    missingBeneficiary: string;
    missingState: string;
    missingPayment: string;
  };
  diagnostic: {
    eyebrow: string;
    title: string;
    intro: string;
    yes: string;
    no: string;
    yesHint: string;
    noHint: string;
    fixLabel: string;
    checklist: string;
    why: string;
    allClear: string;
    next: string;
  };
  draft: {
    eyebrow: string;
    title: string;
    intro: string;
    draftLabel: string;
    routingLabel: string;
    departmentLabel: string;
    departmentHint: string;
    editHint: string;
  };
  evidence: {
    eyebrow: string;
    title: string;
    intro: string;
    scoreLabel: string;
    complete: string;
    needed: string;
    upload: string;
    attached: string;
    items: { key: string; label: string; helper: string }[];
  };
  submission: {
    eyebrow: string;
    title: string;
    intro: string;
    reference: string;
    keepSafe: string;
    statusTitle: string;
    officialLabel: string;
    explanationLabel: string;
    resolutionPrompt: string;
    resolutionAction: string;
    timelineTitle: string;
  };
  resolution: {
    eyebrow: string;
    title: string;
    intro: string;
    options: { key: ResolutionKey; label: string; helper: string }[];
    appealTitle: string;
    appealHint: string;
    successTitle: string;
    successBody: string;
    helpBody: string;
  };
};

export type ResolutionKey = "yes" | "partial" | "no" | "wrong_dept" | "help";

const sharedStages = ["Tell us", "Check", "Draft", "Evidence", "Submit", "Status", "Confirm"];

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    brandTagline: "A clear path for every citizen",
    languageLabel: "Language",
    needHelp: "Need help?",
    back: "Back",
    continue: "Continue",
    saveAndContinue: "Save & continue",
    startOver: "Start over",
    stages: sharedStages,
    stageCounter: (current, total) => `Step ${current} of ${total}`,
    intake: {
      eyebrow: "Start a grievance",
      title: "Let’s make this clear.",
      intro: "Tell us what happened. We’ll ask only what we need to route it correctly.",
      assistant: "Hi, I’m NyayaFlow. I can help you file this PM-KISAN issue.",
      complaintLabel: "What went wrong?",
      complaintPlaceholder: "Example: My PM-KISAN instalment stopped after two payments.",
      voice: "Try voice input",
      voiceHint: "Demo: adds a sample complaint",
      detailsTitle: "A few quick details",
      detailsHint: "Use fictional details for this demo.",
      beneficiaryId: "Beneficiary ID",
      beneficiaryPlaceholder: "Example: PMK-TN-4827",
      state: "State",
      statePlaceholder: "Choose your state",
      lastPayment: "Last payment received",
      required: "Required",
      missingDetails: "Please fill in the highlighted details so we can continue.",
      missingComplaint: "Tell us what went wrong so we can help.",
      missingBeneficiary: "Add your beneficiary ID so we can find the right record.",
      missingState: "Choose your state to route the grievance.",
      missingPayment: "Add the last payment date so we can check the timeline.",
    },
    diagnostic: {
      eyebrow: "Quick check",
      title: "Let’s find the hold-up.",
      intro: "One simple question at a time. Your answers help us suggest the right next step.",
      yes: "Yes",
      no: "No",
      yesHint: "This is complete",
      noHint: "I need to fix this",
      fixLabel: "Next best step",
      checklist: "Checklist",
      why: "Why this matters",
      allClear: "All four checks are clear. Your complaint is ready to file.",
      next: "Continue to complaint draft",
    },
    draft: {
      eyebrow: "Step 3 · Complaint draft",
      title: "Your complaint, in plain words.",
      intro: "We’ve shaped your answers into a draft. You can edit anything before filing.",
      draftLabel: "Complaint draft",
      routingLabel: "Why this department?",
      departmentLabel: "Send it to",
      departmentHint: "You can change this if you know a better office.",
      editHint: "Tap inside to edit",
    },
    evidence: {
      eyebrow: "Step 4 · Evidence",
      title: "Add what you have.",
      intro: "These details help the officer check your case faster. You can continue with what’s ready.",
      scoreLabel: "Ready to file",
      complete: "complete",
      needed: "still helpful",
      upload: "Add screenshot",
      attached: "Screenshot added",
      items: [
        { key: "beneficiaryId", label: "Beneficiary ID", helper: "Your PM-KISAN registration number" },
        { key: "paymentDates", label: "Payment dates", helper: "Last payment and when it stopped" },
        { key: "paymentScreenshot", label: "Payment-status screenshot", helper: "A screenshot from the PM-KISAN portal" },
        { key: "bankReference", label: "Bank reference", helper: "A passbook entry or bank acknowledgement" },
      ],
    },
    submission: {
      eyebrow: "Step 5 · Filed",
      title: "Your grievance is on its way.",
      intro: "Keep this reference number. You can use it when you ask for an update.",
      reference: "Reference number",
      keepSafe: "Save this number somewhere safe",
      statusTitle: "Understand the official update",
      officialLabel: "Official status",
      explanationLabel: "In simple words",
      resolutionPrompt: "The file says “Disposed”. Did the payment actually reach you?",
      resolutionAction: "Tell us what happened",
      timelineTitle: "Your path from here",
    },
    resolution: {
      eyebrow: "Step 7 · Your say matters",
      title: "Did you actually receive the payment?",
      intro: "A complaint is not resolved just because it is marked closed. Tell us what happened.",
      options: [
        { key: "yes", label: "Yes, resolved", helper: "The payment reached me." },
        { key: "partial", label: "Partially resolved", helper: "Some of the payment or service is still missing." },
        { key: "no", label: "No, still unresolved", helper: "The payment did not reach me." },
        { key: "wrong_dept", label: "Wrong department", helper: "This needs to go to another office." },
        { key: "help", label: "Help me understand", helper: "I’m not sure what the official status means." },
      ],
      appealTitle: "Your appeal draft",
      appealHint: "You can edit this before sharing it with the department.",
      successTitle: "Thanks for closing the loop.",
      successBody: "We’ve recorded your answer for this demo. Keep your reference number for future follow-up.",
      helpBody: "Disposed means the department closed the file. It does not prove the payment reached you.",
    },
  },
  ta: {
    brandTagline: "ஒவ்வொரு குடிமகனுக்கும் தெளிவான வழி",
    languageLabel: "மொழி",
    needHelp: "உதவி வேண்டுமா?",
    back: "பின்",
    continue: "தொடரவும்",
    saveAndContinue: "சேமித்து தொடரவும்",
    startOver: "மீண்டும் தொடங்கவும்",
    stages: ["சொல்லுங்கள்", "சரிபார்ப்பு", "வரைவு", "ஆதாரம்", "சமர்ப்பி", "நிலை", "உறுதி"],
    stageCounter: (current, total) => `${total}-ல் ${current}-வது படி`,
    intake: {
      eyebrow: "புகார் தொடங்குங்கள்",
      title: "இதைத் தெளிவாகச் செய்வோம்.",
      intro: "என்ன நடந்தது என்று சொல்லுங்கள். சரியான இடத்திற்கு அனுப்ப தேவையானதை மட்டும் கேட்போம்.",
      assistant: "வணக்கம், நான் NyayaFlow. உங்கள் PM-KISAN பிரச்சினையைப் பதிவு செய்ய உதவுகிறேன்.",
      complaintLabel: "என்ன பிரச்சினை?",
      complaintPlaceholder: "எடுத்துக்காட்டு: இரண்டு தவணைகளுக்குப் பிறகு PM-KISAN பணம் வரவில்லை.",
      voice: "குரல் உள்ளீடு முயற்சி",
      voiceHint: "டெமோ: ஒரு மாதிரி புகாரைச் சேர்க்கும்",
      detailsTitle: "சில விரைவு விவரங்கள்",
      detailsHint: "இந்த டெமோவிற்கு கற்பனை விவரங்களைப் பயன்படுத்தவும்.",
      beneficiaryId: "பயனாளி அடையாள எண்",
      beneficiaryPlaceholder: "எடுத்துக்காட்டு: PMK-TN-4827",
      state: "மாநிலம்",
      statePlaceholder: "மாநிலத்தைத் தேர்ந்தெடுக்கவும்",
      lastPayment: "கடைசியாகப் பெற்ற பணம்",
      required: "தேவை",
      missingDetails: "தொடர முன்னிலைப்படுத்தப்பட்ட விவரங்களை நிரப்பவும்.",
      missingComplaint: "என்ன பிரச்சினை என்று சொல்லுங்கள், நாங்கள் உதவுவோம்.",
      missingBeneficiary: "சரியான பதிவைக் கண்டுபிடிக்க உங்கள் பயனாளி அடையாள எண்ணைச் சேர்க்கவும்.",
      missingState: "புகாரை அனுப்ப மாநிலத்தைத் தேர்ந்தெடுக்கவும்.",
      missingPayment: "காலக்கோட்டைச் சரிபார்க்க கடைசி பணம் வந்த தேதியைச் சேர்க்கவும்.",
    },
    diagnostic: {
      eyebrow: "விரைவு சரிபார்ப்பு",
      title: "தடை எங்கே என்று பார்ப்போம்.",
      intro: "ஒரு நேரத்தில் ஒரு கேள்வி. உங்கள் பதில்கள் அடுத்த சரியான படியைச் சொல்ல உதவும்.",
      yes: "ஆம்",
      no: "இல்லை",
      yesHint: "இது முடிந்தது",
      noHint: "இதைச் சரிசெய்ய வேண்டும்",
      fixLabel: "அடுத்த சிறந்த படி",
      checklist: "சரிபார்ப்பு பட்டியல்",
      why: "இது ஏன் முக்கியம்",
      allClear: "நான்கு சரிபார்ப்புகளும் தெளிவாக உள்ளன. உங்கள் புகாரைத் தாக்கல் செய்யலாம்.",
      next: "புகார் வரைவுக்குச் செல்லவும்",
    },
    draft: {
      eyebrow: "படி 3 · புகார் வரைவு",
      title: "உங்கள் புகார், எளிய வார்த்தைகளில்.",
      intro: "உங்கள் பதில்களை வைத்து ஒரு வரைவை உருவாக்கியுள்ளோம். தாக்கல் செய்வதற்கு முன் மாற்றலாம்.",
      draftLabel: "புகார் வரைவு",
      routingLabel: "இந்தத் துறை ஏன்?",
      departmentLabel: "அனுப்ப வேண்டிய இடம்",
      departmentHint: "வேறு அலுவலகம் என்று தெரிந்தால் மாற்றலாம்.",
      editHint: "மாற்ற உள்ளே தட்டவும்",
    },
    evidence: {
      eyebrow: "படி 4 · ஆதாரம்",
      title: "உங்களிடம் உள்ளதைச் சேர்க்கவும்.",
      intro: "இந்த விவரங்கள் அலுவலர் உங்கள் வழக்கை விரைவாகச் சரிபார்க்க உதவும். தயாரானவற்றுடன் தொடரலாம்.",
      scoreLabel: "தாக்கல் செய்யத் தயார்",
      complete: "முடிந்தது",
      needed: "இன்னும் உதவும்",
      upload: "ஸ்கிரீன்ஷாட் சேர்க்கவும்",
      attached: "ஸ்கிரீன்ஷாட் சேர்க்கப்பட்டது",
      items: [
        { key: "beneficiaryId", label: "பயனாளி அடையாள எண்", helper: "உங்கள் PM-KISAN பதிவு எண்" },
        { key: "paymentDates", label: "பணம் வந்த தேதிகள்", helper: "கடைசியாக வந்த தேதி மற்றும் நின்ற தேதி" },
        { key: "paymentScreenshot", label: "பணம் நிலை ஸ்கிரீன்ஷாட்", helper: "PM-KISAN தளத்தில் இருந்து ஒரு படம்" },
        { key: "bankReference", label: "வங்கி குறிப்பு", helper: "பாஸ்புக் பதிவு அல்லது வங்கி ஒப்புதல்" },
      ],
    },
    submission: {
      eyebrow: "படி 5 · தாக்கல் செய்யப்பட்டது",
      title: "உங்கள் புகார் பயணிக்கிறது.",
      intro: "இந்தக் குறிப்பு எண்ணைப் பாதுகாப்பாக வைத்துக் கொள்ளுங்கள்.",
      reference: "குறிப்பு எண்",
      keepSafe: "இந்த எண்ணை பாதுகாப்பாக சேமிக்கவும்",
      statusTitle: "அதிகாரப்பூர்வ நிலையைப் புரிந்துகொள்ளுங்கள்",
      officialLabel: "அதிகாரப்பூர்வ நிலை",
      explanationLabel: "எளிய வார்த்தைகளில்",
      resolutionPrompt: "கோப்பில் “Disposed” என்று உள்ளது. பணம் உண்மையில் வந்ததா?",
      resolutionAction: "என்ன நடந்தது என்று சொல்லுங்கள்",
      timelineTitle: "இனி உங்கள் பாதை",
    },
    resolution: {
      eyebrow: "படி 7 · உங்கள் பதில் முக்கியம்",
      title: "பணம் உண்மையில் கிடைத்ததா?",
      intro: "புகார் மூடப்பட்டது என்பதால் மட்டும் தீர்வு கிடைத்துவிட்டது என்று அர்த்தமில்லை.",
      options: [
        { key: "yes", label: "ஆம், தீர்வு கிடைத்தது", helper: "பணம் எனக்கு வந்தது." },
        { key: "partial", label: "ஓரளவு தீர்வு", helper: "சில பணம் அல்லது சேவை இன்னும் இல்லை." },
        { key: "no", label: "இல்லை, இன்னும் தீரவில்லை", helper: "பணம் எனக்கு வரவில்லை." },
        { key: "wrong_dept", label: "தவறான துறை", helper: "இது வேறு அலுவலகத்திற்குச் செல்ல வேண்டும்." },
        { key: "help", label: "புரிந்துகொள்ள உதவி தேவை", helper: "அதிகாரப்பூர்வ நிலை என்னவென்று தெரியவில்லை." },
      ],
      appealTitle: "உங்கள் மேல்முறையீட்டு வரைவு",
      appealHint: "துறைக்கு அனுப்பும் முன் இதை மாற்றலாம்.",
      successTitle: "தொடர்ந்து தெரிவித்ததற்கு நன்றி.",
      successBody: "இந்த டெமோவிற்காக உங்கள் பதில் பதிவு செய்யப்பட்டது. எதிர்கால தொடர்புக்கு குறிப்பு எண்ணை வைத்திருங்கள்.",
      helpBody: "Disposed என்பது துறை கோப்பை மூடியது என்று பொருள். பணம் வந்தது என்று அது நிரூபிக்காது.",
    },
  },
  hi: {
    brandTagline: "हर नागरिक के लिए एक स्पष्ट रास्ता",
    languageLabel: "भाषा",
    needHelp: "मदद चाहिए?",
    back: "वापस",
    continue: "जारी रखें",
    saveAndContinue: "सहेजें और जारी रखें",
    startOver: "फिर से शुरू करें",
    stages: ["बताएं", "जाँच", "ड्राफ्ट", "प्रमाण", "जमा करें", "स्थिति", "पुष्टि"],
    stageCounter: (current, total) => `चरण ${current} / ${total}`,
    intake: {
      eyebrow: "शिकायत शुरू करें",
      title: "चलिए इसे स्पष्ट बनाते हैं।",
      intro: "बताएं कि क्या हुआ। हम केवल वही पूछेंगे जो इसे सही विभाग तक भेजने के लिए ज़रूरी है।",
      assistant: "नमस्ते, मैं NyayaFlow हूँ। मैं आपकी शिकायत दर्ज करने में मदद कर सकता हूँ।",
      complaintLabel: "क्या गलत हुआ?",
      complaintPlaceholder: "उदा. : मेरी योजना का भुगतान मुझ तक नहीं पहुँचा।",
      voice: "आवाज़ इनपुट आज़माएं",
      voiceHint: "डेमो: एक नमूना शिकायत जोड़ता है",
      detailsTitle: "कुछ ज़रूरी विवरण",
      detailsHint: "इस डेमो के लिए काल्पनिक विवरण उपयोग करें।",
      beneficiaryId: "लाभार्थी आईडी",
      beneficiaryPlaceholder: "उदा. : PMK-TN-4827",
      state: "राज्य",
      statePlaceholder: "अपना राज्य चुनें",
      lastPayment: "अंतिम भुगतान प्राप्त हुआ",
      required: "अनिवार्य",
      missingDetails: "जारी रखने के लिए कृपया हाइलाइट किए गए विवरण भरें।",
      missingComplaint: "हमारी मदद के लिए बताएं कि क्या गलत हुआ।",
      missingBeneficiary: "सही रिकॉर्ड खोजने के लिए अपनी लाभार्थी आईडी जोड़ें।",
      missingState: "शिकायत भेजने के लिए अपना राज्य चुनें।",
      missingPayment: "समयरेखा जाँचने के लिए अंतिम भुगतान की तारीख जोड़ें।",
    },
    diagnostic: {
      eyebrow: "त्वरित जाँच",
      title: "चलिए रुकावट का पता लगाएं।",
      intro: "एक समय में एक सीधा सा सवाल। आपके उत्तर हमें सही अगला कदम सुझाने में मदद करते हैं।",
      yes: "हाँ",
      no: "नहीं",
      yesHint: "यह पूरा है",
      noHint: "मुझे इसे ठीक करना है",
      fixLabel: "सर्वोत्तम अगला कदम",
      checklist: "जाँच सूची",
      why: "यह क्यों मायने रखता है",
      allClear: "चारों जाँच स्पष्ट हैं। आपकी शिकायत दर्ज करने के लिए तैयार है।",
      next: "शिकायत ड्राफ्ट पर जारी रखें",
    },
    draft: {
      eyebrow: "चरण 3 · शिकायत ड्राफ्ट",
      title: "आपकी शिकायत, साफ शब्दों में।",
      intro: "हमने आपके उत्तरों से एक ड्राफ्ट तैयार किया है। भेजने से पहले आप कुछ भी बदल सकते हैं।",
      draftLabel: "शिकायत ड्राफ्ट",
      routingLabel: "यह विभाग क्यों?",
      departmentLabel: "इसे भेजें",
      departmentHint: "अगर आपको कोई बेहतर कार्यालय पता हो तो बदल सकते हैं।",
      editHint: "संपादित करने के लिए अंदर टैप करें",
    },
    evidence: {
      eyebrow: "चरण 4 · प्रमाण",
      title: "जो आपके पास है वह जोड़ें।",
      intro: "ये विवरण अधिकारी को आपका मामला तेज़ी से जाँचने में मदद करते हैं। आप तैयार वाले के साथ जारी रख सकते हैं।",
      scoreLabel: "दर्ज करने के लिए तैयार",
      complete: "पूर्ण",
      needed: "अभी भी उपयोगी",
      upload: "स्क्रीनशॉट जोड़ें",
      attached: "स्क्रीनशॉट जुड़ गया",
      items: [
        { key: "beneficiaryId", label: "लाभार्थी आईडी", helper: "आपका PM-KISAN पंजीकरण नंबर" },
        { key: "paymentDates", label: "भुगतान तिथियाँ", helper: "अंतिम भुगतान और जब वह रुका" },
        { key: "paymentScreenshot", label: "भुगतान स्थिति स्क्रीनशॉट", helper: "PM-KISAN पोर्टल का एक स्क्रीनशॉट" },
        { key: "bankReference", label: "बैंक संदर्भ", helper: "पासबुक प्रविष्टि या बैंक पावती" },
      ],
    },
    submission: {
      eyebrow: "चरण 5 · दर्ज हुआ",
      title: "आपकी शिकायत रास्ते पर है।",
      intro: "इस संदर्भ संख्या को संभाल कर रखें। अपडेट माँगने पर आप इसका उपयोग कर सकते हैं।",
      reference: "संदर्भ संख्या",
      keepSafe: "इस नंबर को कहीं सुरक्षित रखें",
      statusTitle: "अधिकारिक अपडेट को समझें",
      officialLabel: "अधिकारिक स्थिति",
      explanationLabel: "सरल शब्दों में",
      resolutionPrompt: "फ़ाइल में “Disposed” लिखा है। क्या भुगतान वास्तव में आप तक पहुँचा?",
      resolutionAction: "बताएं कि क्या हुआ",
      timelineTitle: "आगे का आपका रास्ता",
    },
    resolution: {
      eyebrow: "चरण 7 · आपकी बात मायने रखती है",
      title: "क्या भुगतान वास्तव में आपको मिला?",
      intro: "केवल इसलिए कि फ़ाइल बंद है, इसका मतलब यह नहीं कि समाधान मिल गया। बताएं कि क्या हुआ।",
      options: [
        { key: "yes", label: "हाँ, हल हो गया", helper: "भुगतान मेरे पास आया।" },
        { key: "partial", label: "आंशिक रूप से हल", helper: "कुछ भुगतान या सेवा अभी भी कम है।" },
        { key: "no", label: "नहीं, अभी भी अनसुलझा", helper: "भुगतान मेरे पास नहीं आया।" },
        { key: "wrong_dept", label: "गलत विभाग", helper: "इसे किसी और कार्यालय में जाना चाहिए।" },
        { key: "help", label: "समझने में मदद करें", helper: "मुझे अधिकारिक स्थिति का मतलब स्पष्ट नहीं है।" },
      ],
      appealTitle: "आपका अपील ड्राफ्ट",
      appealHint: "विभाग को साझा करने से पहले इसे बदल सकते हैं।",
      successTitle: "लूप बंद करने के लिए धन्यवाद।",
      successBody: "हमने इस डेमो के लिए आपका उत्तर दर्ज कर लिया है। भविष्य के अनुसरण के लिए अपनी संदर्भ संख्या रखें।",
      helpBody: "Disposed का अर्थ है कि विभाग ने फ़ाइल बंद कर दी। इसका मतलब यह नहीं कि भुगतान आप तक पहुँचा।",
    },
  },
};
