// NyayaFlow Unified Indic Citizen Grievance & Appeal Platform
// BuildWhatMovesIndia Hackathon Edition

const API_BASE = window.location.origin;

// ── XSS Protection: Escape user-generated content before innerHTML injection ──
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── SLA Deadlines (days) per status — matches backend SLA_DEADLINES ──
const SLA_DAYS = { submitted: 7, routed: 15, under_process: 30 };

// State
let currentLang = 'en';
let currentView = 'assistant';
let currentStep = 1; // 1: Category, 2: Intake, 3: Diagnostic, 4: Routing, 5: Evidence, 6: Petition, 7: Tracking
let selectedCategory = null;
let diagnosticRules = null;
let currentDiagIndex = 0;
let diagnosticAnswers = {};
let routingResult = null;
let evidenceState = {
  aadhaar: true,
  registrationProof: true,
  bankProof: false,
  statusScreenshot: false
};
let createdCase = null;
let currentTrackingCase = null;

// Multi-lingual dictionary
const i18n = {
  en: {
    brandTagline: "Explainable Indian Citizen Grievance & Appeal Redressal Engine",
    assistantTab: "🏛️ Grievance Assistant",
    casesTab: "📂 Live Cases Explorer",
    metricsTab: "📊 Governance Metrics",
    pitchBrief: "🏆 Pitch & Rubric Brief",
    apiDocs: "⚙️ API Docs",
    judgeTitle: "Judge & Presenter Sandbox:",
    judgeSubtitle: "1-Click pre-loaded grievance personas for live evaluation",
    step1: "Scheme",
    step2: "Intake",
    step3: "Diagnostics",
    step4: "Routing",
    step5: "Evidence",
    step6: "Petition",
    step7: "Tracker",
    startTitle: "What citizen service or entitlement is stuck?",
    startSubtitle: "Select the government scheme below to begin ordered prerequisite diagnosis.",
    categories: {
      pm_kisan_payment_failure: {
        title: "PM-KISAN Payment Failure",
        desc: "₹2,000 installment stopped, NPCI Aadhaar bank mapping inactive, or land record mismatch.",
        badge: "Direct Benefit Transfer (DBT)"
      },
      epfo_claim_rejected: {
        title: "EPFO PF Claim Rejected",
        desc: "Form 19/31 claim rejected due to name mismatch with Aadhaar, bank KYC, or missing exit date.",
        badge: "Social Security / EPFO"
      },
      income_tax_refund_delayed: {
        title: "Income Tax Refund Delayed",
        desc: "ITR refund pending beyond 60 days, Section 245 outstanding demand adjustment, or AIS mismatch.",
        badge: "Direct Taxes / CPC"
      },
      scholarship_nsp_payment_stuck: {
        title: "NSP Scholarship Stuck",
        desc: "National Scholarship Portal payment pending at Institute or State/District Nodal Officer validation.",
        badge: "Higher Education / DBT"
      }
    },
    intakeTitle: "Describe Your Grievance",
    intakeSubtitle: "Provide details of your pending payment or entitlement.",
    complaintLabel: "Complaint Description / Issue Text",
    complaintPlaceholder: "Explain what happened (e.g. My 14th PM-KISAN installment has not arrived...)",
    voiceInput: "🎙️ Voice Input",
    nameLabel: "Citizen / Beneficiary Name",
    idLabel: "Beneficiary / Registration Reference",
    stateLabel: "State / UT",
    dateLabel: "Last Successful Payment Date",
    back: "⬅ Back",
    continueDiag: "Continue to Diagnostic Checks ➔",
    diagTitle: "Deterministic Prerequisite Diagnostics",
    diagSubtitle: "Ordered verification tree ensuring all prerequisite conditions are met before official department routing.",
    continueRouting: "Continue to Routing ➔",
    routingTitle: "Explainable Department Routing",
    routingSubtitle: "Transparent rule engine mapping your grievance to the designated Central/State Ministry.",
    continueEvidence: "Continue to Evidence Checklist ➔",
    evidenceTitle: "Evidence Completeness & Document Readiness",
    evidenceSubtitle: "Check mandatory and supporting documents to avoid preliminary rejection by the department.",
    readinessScoreLabel: "Readiness Score",
    generatePetition: "Generate Official Petition ➔",
    petitionTitle: "Official Citizen Grievance Petition",
    petitionSubtitle: "Standardized legal grievance draft ready for submission to CPGRAMS / Department Portal.",
    copyPetition: "📋 Copy Petition",
    submitEngine: "Submit & Track in Engine ➔",
    timelineTitle: "Departmental Audit Timeline",
    timelineSubtitle: "Immutable audit timestamps",
    fileAnother: "➕ File Another Grievance",
    viewExplorer: "📂 View All Cases in Explorer",
    casesTitle: "Live SQLite Cases Explorer",
    casesSubtitle: "Browse and track all persisted citizen grievance records, status transitions, and audit logs.",
    refreshCases: "🔄 Refresh Cases",
    thCaseId: "Case ID",
    thScheme: "Scheme",
    thComplaint: "Complaint Snippet",
    thDept: "Routed Department",
    thStatus: "Status",
    thConfirmation: "Citizen Confirmation",
    metricsTitle: "Public Governance Transparency & Redressal Analytics",
    metricsSubtitle: "Real-time metrics demonstrating the critical gap between administrative disposal and true citizen resolution.",
    refreshMetrics: "🔄 Refresh Metrics",
    metricLabel1: "Total Grievances Filed",
    metricSub1: "Across 4 central welfare schemes",
    metricLabel2: "Officially Disposed",
    metricSub2: "Marked closed by departments",
    metricLabel3: "Citizen Resolution Rate",
    metricSub3: "Citizens confirming real relief",
    metricLabel4: "CPGRAMS First Appeals",
    metricSub4: "Generated after premature disposal",
    metricLabel5: "Routing Accuracy",
    metricSub5: "Deterministic rule matching",
    metricsBreakdownTitle: "Scheme Distribution Breakdown"
  },
  hi: {
    brandTagline: "पारदर्शी भारतीय नागरिक शिकायत निवारण एवं अपील प्रणाली",
    assistantTab: "🏛️ शिकायत सहायक",
    casesTab: "📂 सक्रिय मामले",
    metricsTab: "📊 सुशासन विश्लेषण",
    pitchBrief: "🏆 प्रस्तुति व रूब्रिक",
    apiDocs: "⚙️ एपीआई डॉक्स",
    judgeTitle: "जज व परीक्षक सैंडबॉक्स:",
    judgeSubtitle: "1-क्लिक में विभिन्न योजनाओं के पूर्व-निर्धारित मामले लोड करें",
    step1: "योजना",
    step2: "विवरण",
    step3: "जांच",
    step4: "विभाग",
    step5: "दस्तावेज",
    step6: "आवेदन",
    step7: "स्थिति",
    startTitle: "आपकी कौन सी सरकारी योजना या सेवा बाधित है?",
    startSubtitle: "क्रमबद्ध जांच शुरू करने के लिए नीचे दी गई योजना का चयन करें।",
    categories: {
      pm_kisan_payment_failure: {
        title: "पीएम-किसान किस्त नहीं मिली",
        desc: "₹2,000 की किस्त रुकी है, एनपीसीआई आधार सीडिंग या भूलेख रिकॉर्ड मिसमैच।",
        badge: "प्रत्यक्ष लाभ अंतरण (DBT)"
      },
      epfo_claim_rejected: {
        title: "ईपीएफओ पीएफ क्लेम अस्वीकृत",
        desc: "नाम मिसमैच, बैंक केवाईसी या एग्जिट डेट के कारण क्लेम खारिज हुआ।",
        badge: "कर्मचारी भविष्य निधि"
      },
      income_tax_refund_delayed: {
        title: "आयकर रिफंड में देरी",
        desc: "धारा 245 नोटिस या फॉर्म 26AS मिलान के कारण रिफंड अटका है।",
        badge: "आयकर विभाग (CPC)"
      },
      scholarship_nsp_payment_stuck: {
        title: "एनएसपी छात्रवृत्ति लंबित",
        desc: "संस्थान या जिला/राज्य नोडल अधिकारी के सत्यापन स्तर पर रुकावट।",
        badge: "राष्ट्रीय छात्रवृत्ति पोर्टल"
      }
    },
    intakeTitle: "अपनी शिकायत का विवरण दें",
    intakeSubtitle: "अपनी लंबित भुगतान या योजना का विवरण दर्ज करें।",
    complaintLabel: "शिकायत का विवरण / समस्या",
    complaintPlaceholder: "समस्या बताएं (उदा. मेरी पीएम-किसान 14वीं किस्त अभी तक प्राप्त नहीं हुई...)",
    voiceInput: "🎙️ वॉयस इनपुट",
    nameLabel: "नागरिक / लाभार्थी का नाम",
    idLabel: "लाभार्थी / पंजीकरण संदर्भ संख्या",
    stateLabel: "राज्य / केंद्र शासित प्रदेश",
    dateLabel: "अंतिम सफल भुगतान तिथि",
    back: "⬅ पीछे जाएं",
    continueDiag: "जांच की ओर बढ़ें ➔",
    diagTitle: "क्रमबद्ध अनिवार्य पूर्व-शर्त जांच",
    diagSubtitle: "विभागीय प्रेषण से पूर्व सभी आवश्यक तकनीकी शर्तों का पारदर्शी सत्यापन।",
    continueRouting: "विभाग चयन की ओर बढ़ें ➔",
    routingTitle: "पारदर्शी मंत्रालय व विभाग मैपिंग",
    routingSubtitle: "नियम आधारित इंजन जो शिकायत को संबंधित सरकारी विभाग से जोड़ता है।",
    continueEvidence: "दस्तावेज जांच की ओर बढ़ें ➔",
    evidenceTitle: "दस्तावेज पूर्णता एवं तैयारी मीटर",
    evidenceSubtitle: "अस्वीकृति से बचने के लिए अनिवार्य एवं सहायक दस्तावेजों की जांच करें।",
    readinessScoreLabel: "दस्तावेज तैयारी स्कोर",
    generatePetition: "औपचारिक आवेदन तैयार करें ➔",
    petitionTitle: "नागरिक औपचारिक शिकायत पत्र",
    petitionSubtitle: "CPGRAMS एवं विभागीय पोर्टल हेतु कानूनी रूप से प्रमाणित आवेदन।",
    copyPetition: "📋 आवेदन कॉपी करें",
    submitEngine: "इंजन में दर्ज करें व ट्रैक करें ➔",
    timelineTitle: "विभागीय ऑडिट समय-सीमा",
    timelineSubtitle: "अपरिवर्तनीय डिजिटल समय-अंकन",
    fileAnother: "➕ नई शिकायत दर्ज करें",
    viewExplorer: "📂 सभी मामले देखें",
    casesTitle: "सक्रिय SQLite मामले एक्सप्लोरर",
    casesSubtitle: "दर्ज की गई शिकायतों, विभागीय प्रगति और ऑडिट लॉग का वास्तविक समय विवरण।",
    refreshCases: "🔄 रिफ्रेश करें",
    thCaseId: "केस आईडी",
    thScheme: "योजना",
    thComplaint: "शिकायत अंश",
    thDept: "संबंधित विभाग",
    thStatus: "स्थिति",
    thConfirmation: "नागरिक पुष्टि",
    metricsTitle: "सार्वजनिक सुशासन पारदर्शिता एवं निवारण विश्लेषण",
    metricsSubtitle: "प्रशासनिक कागजी निस्तारण और वास्तविक नागरिक राहत के बीच के अंतर का विश्लेषण।",
    refreshMetrics: "🔄 मेट्रिक्स रिफ्रेश करें",
    metricLabel1: "कुल दर्ज शिकायतें",
    metricSub1: "4 प्रमुख केंद्रीय कल्याणकारी योजनाओं में",
    metricLabel2: "कागजी निस्तारित",
    metricSub2: "विभागों द्वारा बंद की गई",
    metricLabel3: "वास्तविक नागरिक समाधान दर",
    metricSub3: "नागरिकों द्वारा राहत की पुष्टि",
    metricLabel4: "CPGRAMS प्रथम अपील",
    metricSub4: "अपूर्ण निस्तारण के बाद जनरेट की गई",
    metricLabel5: "सटीक विभाग मैपिंग दर",
    metricSub5: "नियम-आधारित सटीक मिलान",
    metricsBreakdownTitle: "योजना-वार शिकायत वितरण"
  },
  ta: {
    brandTagline: "விளக்கக்கூடிய இந்திய குடிமக்கள் குறைதீர்க்கும் மற்றும் மேல்முறையீட்டு தளம்",
    assistantTab: "🏛️ குறைதீர்க்கும் உதவியாளர்",
    casesTab: "📂 செயலில் உள்ள வழக்குகள்",
    metricsTab: "📊 அரசாங்க அளவீடுகள்",
    pitchBrief: "🏆 விளக்கம் மற்றும் விதிமுறை",
    apiDocs: "⚙️ API ஆவணங்கள்",
    judgeTitle: "நடுவர் பரிசோதனை களம்:",
    judgeSubtitle: "ஒரே கிளிக்கில் மாதிரி வழக்குகளை ஆய்வு செய்யுங்கள்",
    step1: "திட்டம்",
    step2: "விவரம்",
    step3: "பரிசோதனை",
    step4: "துறை",
    step5: "ஆவணம்",
    step6: "மனு",
    step7: "கண்காணிப்பு",
    startTitle: "எந்த அரசாங்க சேவை அல்லது உதவித்தொகை தடைபட்டுள்ளது?",
    startSubtitle: "முன்நிபந்தனை சோதனையைத் தொடங்க திட்டத்தைத் தேர்ந்தெடுக்கவும்.",
    categories: {
      pm_kisan_payment_failure: {
        title: "பி.எம்-கிசான் தவணை நிறுத்தம்",
        desc: "ரூ.2,000 தவணை வரவில்லை, ஆதார் வங்கி இணைப்பு அல்லது நில ஆவண முரண்பாடு.",
        badge: "நேரடிப் பலன் பரிமாற்றம் (DBT)"
      },
      epfo_claim_rejected: {
        title: "இ.பி.எஃப்.ஓ பி.எஃப் நிராகரிப்பு",
        desc: "பெயர் முரண்பாடு, வங்கி கே.ஒய்.சி அல்லது பணி நிறைவு தேதி காரணங்கள்.",
        badge: "வருங்கால வைப்பு நிதி"
      },
      income_tax_refund_delayed: {
        title: "வருமான வரி திரும்பப்பெறுதல் தாமதம்",
        desc: "பிரிவு 245 நிலுவை நோட்டீஸ் அல்லது கணக்கு முரண்பாடு.",
        badge: "வருமான வரித்துறை (CPC)"
      },
      scholarship_nsp_payment_stuck: {
        title: "என்.எஸ்.பி கல்வி உதவித்தொகை தாமதம்",
        desc: "கல்வி நிறுவனம் அல்லது மாவட்ட/மாநில அலுவலர் ஒப்புதல் தாமதம்.",
        badge: "தேசிய கல்வி உதவித்தொகை"
      }
    },
    intakeTitle: "உங்கள் குறையை விவரிக்கவும்",
    intakeSubtitle: "நிலுவையில் உள்ள தொகை அல்லது திட்டத்தின் விவரங்களை உள்ளிடவும்.",
    complaintLabel: "புகார் விவரம் / பிரச்சனை",
    complaintPlaceholder: "என்ன நடந்தது என்பதை விளக்குங்கள் (எ.கா. எனது பிஎம்-கிசான் 14வது தவணை வரவில்லை...)",
    voiceInput: "🎙️ குரல் உள்ளீடு",
    nameLabel: "குடிமகன் / பயனாளி பெயர்",
    idLabel: "பயனாளி / பதிவு குறிப்பு எண்",
    stateLabel: "மாநிலம் / யூனியன் பிரதேசம்",
    dateLabel: "கடைசி கட்டண தேதி",
    back: "⬅ பின்செல்க",
    continueDiag: "பரிசோதனைக்கு தொடரவும் ➔",
    diagTitle: "வரிசைப்படுத்தப்பட்ட முன்நிபந்தனை சோதனைகள்",
    diagSubtitle: "துறைக்கு அனுப்பும் முன் அனைத்து தேவைகளும் பூர்த்தி செய்யப்பட்டுள்ளதா என்பதை உறுதிப்படுத்துகிறது.",
    continueRouting: "துறை தேர்வுக்கு செல்க ➔",
    routingTitle: "வெளிப்படையான துறை ஒதுக்கீடு",
    routingSubtitle: "உங்கள் புகாரை குறிப்பிட்ட அமைச்சகத்துடன் இணைக்கும் விதிமுறை இயந்திரம்.",
    continueEvidence: "ஆவண சரிபார்ப்புக்கு செல்க ➔",
    evidenceTitle: "ஆவண முழுமை மற்றும் தயார்நிலை அளவீடு",
    evidenceSubtitle: "நிராகரிப்பைத் தவிர்க்க தேவையான ஆவணங்களை சரிபார்க்கவும்.",
    readinessScoreLabel: "ஆவண தயார்நிலை மதிப்பெண்",
    generatePetition: "அதிகாரப்பூர்வ மனுவை உருவாக்கவும் ➔",
    petitionTitle: "அதிகாரப்பூர்வ குடிமக்கள் குறைதீர்ப்பு மனு",
    petitionSubtitle: "CPGRAMS மற்றும் துறை போர்ட்டலுக்கான சட்டப்பூர்வ மனு வரைவு.",
    copyPetition: "📋 மனுவை நகலெடு",
    submitEngine: "பதிவு செய்து கண்காணிக்கவும் ➔",
    timelineTitle: "துறை தணிக்கை காலவரிசை",
    timelineSubtitle: "மாற்ற முடியாத டிஜிட்டல் நேரப்பதிவுகள்",
    fileAnother: "➕ மற்றொரு புகாரைப் பதிவுசெய்க",
    viewExplorer: "📂 அனைத்து வழக்குகளையும் காண்க",
    casesTitle: "செயலில் உள்ள SQLite வழக்குகள்",
    casesSubtitle: "பதிவுசெய்யப்பட்ட புகார்கள், துறை முன்னேற்றம் மற்றும் தணிக்கை பதிவுகள்.",
    refreshCases: "🔄 புதுப்பிக்கவும்",
    thCaseId: "வழக்கு எண்",
    thScheme: "திட்டம்",
    thComplaint: "புகார் சுருக்கம்",
    thDept: "ஒதுக்கப்பட்ட துறை",
    thStatus: "நிலை",
    thConfirmation: "குடிமக்கள் உறுதிப்படுத்தல்",
    metricsTitle: "பொது நிர்வாக வெளிப்படைத்தன்மை மற்றும் தீர்வு பகுப்பாய்வு",
    metricsSubtitle: "நிர்வாக தீர்வுக்கும் உண்மையான குடிமக்கள் நிவாரணத்திற்கும் இடையிலான இடைவெளி.",
    refreshMetrics: "🔄 அளவீடுகளைப் புதுப்பி",
    metricLabel1: "மொத்த புகார்கள்",
    metricSub1: "4 மத்திய திட்டங்களில்",
    metricLabel2: "அலுவலக ரீதியாக முடிக்கப்பட்டவை",
    metricSub2: "துறைகளால் மூடப்பட்டது",
    metricLabel3: "உண்மையான தீர்வு விகிதம்",
    metricSub3: "பணம் கிடைத்ததை உறுதிசெய்தவர்கள்",
    metricLabel4: "CPGRAMS முதல் மேல்முறையீடுகள்",
    metricSub4: "முன்கூட்டியே மூடப்பட்ட பின் உருவாக்கப்பட்டது",
    metricLabel5: "துறை ஒதுக்கீட்டு துல்லியம்",
    metricSub5: "விதி அடிப்படையிலான பொருத்தம்",
    metricsBreakdownTitle: "திட்ட வாரியான புகார் பகிர்வு"
  },
  te: {
    brandTagline: "సులభంగా అర్థమయ్యే భారతీయ పౌర ఫిర్యాదుల పరిష్కార మరియు అప్పీల్ వేదిక",
    assistantTab: "🏛️ ఫిర్యాదు సహాయకుడు",
    casesTab: "📂 ప్రత్యక్ష కేసులు",
    metricsTab: "📊 పాలన కొలమానాలు",
    pitchBrief: "🏆 ప్రాజెక్ట్ వివరణ",
    apiDocs: "⚙️ API పత్రాలు",
    judgeTitle: "న్యాయనిర్ణేతల పరీక్షా వేదిక:",
    judgeSubtitle: "ఒక్క క్లిక్‌తో నమూనా కేసులను లోడ్ చేసి పరిశీలించండి",
    step1: "పథకం",
    step2: "వివరాలు",
    step3: "పరిశీలన",
    step4: "శాఖ",
    step5: "పత్రాలు",
    step6: "దరఖాస్తు",
    step7: "స్థితి",
    startTitle: "మీ ఏ ప్రభుత్వ సంక్షేమ సేవ లేదా చెల్లింపు నిలిచిపోయింది?",
    startSubtitle: "క్రమబద్ధమైన ముందస్తు అర్హత పరీక్షను ప్రారంభించడానికి క్రింద పథకాన్ని ఎంచుకోండి.",
    categories: {
      pm_kisan_payment_failure: {
        title: "పీఎం-కిసాన్ వాయిదా నిలిపివేత",
        desc: "₹2,000 వాయిదా రాలేదు, NPCI ఆధార్ బ్యాంక్ మ్యాపింగ్ లేదా భూమి రికార్డు సరిపోలకపోవడం.",
        badge: "ప్రత్యక్ష నగదు బదిలీ (DBT)"
      },
      epfo_claim_rejected: {
        title: "EPFO పీఎఫ్ క్లెయిమ్ తిరస్కరణ",
        desc: "ఆధార్‌తో పేరు సరిపోలకపోవడం, బ్యాంక్ KYC లేదా నిష్క్రమణ తేదీ సమస్యలు.",
        badge: "ఉద్యోగుల భవిష్య నిధి"
      },
      income_tax_refund_delayed: {
        title: "ఆదాయపు పన్ను రీఫండ్ ఆలస్యం",
        desc: "సెక్షన్ 245 నోటీసు లేదా ఫారం 26AS వ్యత్యాసం కారణంగా రీఫండ్ ఆగిపోయింది.",
        badge: "ఆదాయపు పన్ను శాఖ (CPC)"
      },
      scholarship_nsp_payment_stuck: {
        title: "NSP స్కాలర్‌షిప్ ఆలస్యం",
        desc: "కళాశాల లేదా జిల్లా/రాష్ట్ర నోడల్ అధికారి ధృవీకరణ స్థాయిలో పెండింగ్‌లో ఉంది.",
        badge: "జాతీయ స్కాలర్‌షిప్ పోర్టల్"
      }
    },
    intakeTitle: "మీ ఫిర్యాదును వివరించండి",
    intakeSubtitle: "మీ పెండింగ్ చెల్లింపు లేదా పథకం వివరాలను అందించండి.",
    complaintLabel: "ఫిర్యాదు వివరణ / సమస్య",
    complaintPlaceholder: "సమస్యను వివరించండి (ఉదా. నా పీఎం-కిసాన్ 14వ వాయిదా ఇంకా ఖాతాలో జమ కాలేదు...)",
    voiceInput: "🎙️ వాయిస్ ఇన్‌పుట్",
    nameLabel: "పౌరుడు / లబ్ధిదారుని పేరు",
    idLabel: "రిజిస్ట్రేషన్ / లబ్ధిదారుని రిఫరెన్స్ నంబర్",
    stateLabel: "రాష్ట్రం / కేంద్రపాలిత ప్రాంతం",
    dateLabel: "చివరి విజయవంతమైన చెల్లింపు తేదీ",
    back: "⬅ వెనుకకు",
    continueDiag: "పరిశీలన కొనసాగించండి ➔",
    diagTitle: "క్రమబద్ధమైన అర్హత ప్రమాణాల పరిశీలన",
    diagSubtitle: "శాఖకు పంపే ముందు అన్ని ప్రాథమిక సాంకేతిక నిబంధనలు పూర్తయ్యాయని నిర్ధారిస్తుంది.",
    continueRouting: "శాఖ ఎంపికకు వెళ్లండి ➔",
    routingTitle: "పారదర్శక శాఖ రూటింగ్ ఇంజిన్",
    routingSubtitle: "మీ ఫిర్యాదును సరైన కేంద్ర/రాష్ట్ర మంత్రిత్వ శాఖకు అనుసంధానించే నియమ వ్యవస్థ.",
    continueEvidence: "పత్రాల తనిఖీకి వెళ్లండి ➔",
    evidenceTitle: "పత్రాల సమగ్రత మరియు సంసిద్ధత స్కోర్",
    evidenceSubtitle: "తిరస్కరణను నివారించడానికి అవసరమైన పత్రాలను తనిఖీ చేయండి.",
    readinessScoreLabel: "సంసిద్ధత స్కోర్",
    generatePetition: "అధికారిక దరఖాస్తును రూపొందించండి ➔",
    petitionTitle: "అధికారిక పౌర ఫిర్యాదు పత్రం",
    petitionSubtitle: "CPGRAMS మరియు ప్రభుత్వ పోర్టల్స్ కోసం ప్రామాణిక న్యాయపరమైన దరఖాస్తు.",
    copyPetition: "📋 దరఖాస్తును కాపీ చేయండి",
    submitEngine: "ఇంజిన్‌లో నమోదు చేసి ట్రాక్ చేయండి ➔",
    timelineTitle: "శాఖ ఆడిట్ కాలక్రమం",
    timelineSubtitle: "మార్చలేని డిజిటల్ సమయ రికార్డులు",
    fileAnother: "➕ మరొక ఫిర్యాదు చేయండి",
    viewExplorer: "📂 అన్ని కేసులను చూడండి",
    casesTitle: "ప్రత్యక్ష SQLite కేసుల వివరాలు",
    casesSubtitle: "నమోదైన ఫిర్యాదులు, శాఖ పురోగతి మరియు ఆడిట్ లాగ్స్.",
    refreshCases: "🔄 రీఫ్రెష్ చేయండి",
    thCaseId: "కేసు ID",
    thScheme: "పథకం",
    thComplaint: "ఫిర్యాదు సారాంశం",
    thDept: "కేటాయించిన శాఖ",
    thStatus: "స్థితి",
    thConfirmation: "పౌరుని నిర్ధారణ",
    metricsTitle: "ప్రజా పాలనా పారదర్శకత మరియు పరిష్కార విశ్లేషణ",
    metricsSubtitle: "పరిపాలనా ముగింపునకు మరియు నిజమైన పౌర ఉపశమనానికి మధ్య ఉన్న వ్యత్యాసం.",
    refreshMetrics: "🔄 గణాంకాలను రీఫ్రెష్ చేయండి",
    metricLabel1: "మొత్తం నమోదైన ఫిర్యాదులు",
    metricSub1: "4 ప్రధాన సంక్షేమ పథకాలలో",
    metricLabel2: "కాగితాలపై పరిష్కరించినవి",
    metricSub2: "శాఖల ద్వారా మూసివేయబడినవి",
    metricLabel3: "నిజమైన పౌర పరిష్కార రేటు",
    metricSub3: "నగదు అందినట్లు నిర్ధారించినవారు",
    metricLabel4: "CPGRAMS మొదటి అప్పీళ్లు",
    metricSub4: "పరిష్కారం కానందున రూపొందించినవి",
    metricLabel5: "శాఖ రూటింగ్ ఖచ్చితత్వం",
    metricSub5: "ఖచ్చితమైన నియమ మ్యాపింగ్",
    metricsBreakdownTitle: "పథకాల వారీగా ఫిర్యాదుల పంపిణీ"
  },
  kn: {
    brandTagline: "ವಿವರಣಾತ್ಮಕ ಭಾರತೀಯ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ನಿವಾರಣೆ ಮತ್ತು ಮೇಲ್ಮನವಿ ವೇದಿಕೆ",
    assistantTab: "🏛️ ಕುಂದುಕೊರತೆ ಸಹಾಯಕ",
    casesTab: "📂 ಲೈವ್ ಪ್ರಕರಣಗಳು",
    metricsTab: "📊 ಆಡಳಿತ ಮೆಟ್ರಿಕ್ಸ್",
    pitchBrief: "🏆 ಯೋಜನೆ ವಿವರಣೆ",
    apiDocs: "⚙️ API ದಾಖಲೆಗಳು",
    judgeTitle: "ತೀರ್ಪುಗಾರರ ಪರೀಕ್ಷಾ ವೇದಿಕೆ:",
    judgeSubtitle: "ಒಂದು ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಮಾದರಿ ಪ್ರಕರಣಗಳನ್ನು ಲೋಡ್ ಮಾಡಿ ಪರಿಶೀಲಿಸಿ",
    step1: "ಯೋಜನೆ",
    step2: "ವಿವರ",
    step3: "ಪರಿಶೀಲನೆ",
    step4: "ಇಲಾಖೆ",
    step5: "ದಾಖಲೆ",
    step6: "ಮನವಿ",
    step7: "ಸ್ಥಿತಿ",
    startTitle: "ನಿಮ್ಮ ಯಾವ ಸರ್ಕಾರಿ ಸೇವೆ ಅಥವಾ ಸವಲತ್ತು ಸ್ಥಗಿತಗೊಂಡಿದೆ?",
    startSubtitle: "ಕ್ರಮಬದ್ಧ ಪೂರ್ವಭಾವಿ ಪರೀಕ್ಷೆಯನ್ನು ಪ್ರಾರಂಭಿಸಲು ಕೆಳಗಿನ ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    categories: {
      pm_kisan_payment_failure: {
        title: "ಪಿಎಂ-ಕಿಸಾನ್ ಕಂತು ಸ್ಥಗಿತ",
        desc: "₹2,000 ಕಂತು ಜಮೆಯಾಗಿಲ್ಲ, NPCI ಆಧಾರ್ ಬ್ಯಾಂಕ್ ಮ್ಯಾಪಿಂಗ್ ಅಥವಾ ಜಮೀನು ದಾಖಲೆ ವ್ಯತ್ಯಾಸ.",
        badge: "ನೇರ ನಗದು ವರ್ಗಾವಣೆ (DBT)"
      },
      epfo_claim_rejected: {
        title: "EPFO ಪಿಎಫ್ ಕ್ಲೈಮ್ ತಿರಸ್ಕಾರ",
        desc: "ಆಧಾರ್ ಜತೆ ಹೆಸರು ವ್ಯತ್ಯಾಸ, ಬ್ಯಾಂಕ್ ಕೆವೈಸಿ ಅಥವಾ ನಿರ್ಗಮನ ದಿನಾಂಕದ ತೊಂದರೆ.",
        badge: "ನೌಕರರ ಭವಿಷ್ಯ ನಿಧಿ"
      },
      income_tax_refund_delayed: {
        title: "ಆದಾಯ ತೆರಿಗೆ ಮರುಪಾವತಿ ವಿಳಂಬ",
        desc: "ಸೆಕ್ಷನ್ 245 ನೋಟಿಸ್ ಅಥವಾ ಫಾರ್ಮ್ 26AS ಹೊಂದಾಣಿಕೆಯಾಗದ ಕಾರಣ ಮರುಪಾವತಿ ವಿಳಂಬ.",
        badge: "ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ (CPC)"
      },
      scholarship_nsp_payment_stuck: {
        title: "NSP ವಿದ್ಯಾರ್ಥಿವೇತನ ವಿಳಂಬ",
        desc: "ಕಾಲೇಜು ಅಥವಾ ಜಿಲ್ಲಾ/ರಾಜ್ಯ ನೋಡಲ್ ಅಧಿಕಾರಿ ಪರಿಶೀಲನೆ ಹಂತದಲ್ಲಿ ಬಾಕಿ ಇದೆ.",
        badge: "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್"
      }
    },
    intakeTitle: "ನಿಮ್ಮ ದೂರನ್ನು ವಿವರಿಸಿ",
    intakeSubtitle: "ನಿಮ್ಮ ಬಾಕಿ ಪಾವತಿ ಅಥವಾ ಸವಲತ್ತಿನ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.",
    complaintLabel: "ದೂರಿನ ವಿವರಣೆ / ಸಮಸ್ಯೆ",
    complaintPlaceholder: "ಏನಾಯಿತು ಎಂದು ವಿವರಿಸಿ (ಉದಾ. ನನ್ನ ಪಿಎಂ-ಕಿಸಾನ್ 14ನೇ ಕಂತು ಇನ್ನೂ ಬಂದಿಲ್ಲ...)",
    voiceInput: "🎙️ ಧ್ವನಿ ಇನ್‌ಪುಟ್",
    nameLabel: "ನಾಗರಿಕ / ಫಲಾನುಭವಿಯ ಹೆಸರು",
    idLabel: "ಫಲಾನುಭವಿ / ನೋಂದಣಿ ಸಂಖ್ಯೆ",
    stateLabel: "ರಾಜ್ಯ / ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶ",
    dateLabel: "ಕೊನೆಯ ಯಶಸ್ವಿ ಪಾವತಿ ದಿನಾಂಕ",
    back: "⬅ ಹಿಂದಕ್ಕೆ",
    continueDiag: "ಪರಿಶೀಲನೆಗೆ ಮುಂದುವರಿಯಿರಿ ➔",
    diagTitle: "ಕ್ರಮಬದ್ಧ ಪೂರ್ವಭಾವಿ ಪರಿಶೀಲನೆಗಳು",
    diagSubtitle: "ಇಲಾಖೆಗೆ ಕಳುಹಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ತಾಂತ್ರಿಕ ಷರತ್ತುಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ ಎಂಬುದನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ.",
    continueRouting: "ಇಲಾಖೆ ಆಯ್ಕೆಗೆ ಮುಂದುವರಿಯಿರಿ ➔",
    routingTitle: "ಪಾರದರ್ಶಕ ಇಲಾಖೆ ನಿಯೋಜನೆ",
    routingSubtitle: "ನಿಮ್ಮ ದೂರನ್ನು ಸೂಕ್ತ ಕೇಂದ್ರ/ರಾಜ್ಯ ಸಚಿವಾಲಯಕ್ಕೆ ಸಂಪರ್ಕಿಸುವ ನಿಯಮ ಎಂಜಿನ್.",
    continueEvidence: "ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆಗೆ ಹೋಗಿ ➔",
    evidenceTitle: "ದಾಖಲೆಗಳ ಪೂರ್ಣತೆ ಮತ್ತು ಸಿದ್ಧತೆ ಸ್ಕೋರ್",
    evidenceSubtitle: "ತಿರಸ್ಕಾರವನ್ನು ತಪ್ಪಿಸಲು ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    readinessScoreLabel: "ಸಿದ್ಧತೆ ಸ್ಕೋರ್",
    generatePetition: "ಅಧಿಕೃತ ಮನವಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿ ➔",
    petitionTitle: "ಅಧಿಕೃತ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಅರ್ಜಿ",
    petitionSubtitle: "CPGRAMS ಮತ್ತು ಇಲಾಖಾ ಪೋರ್ಟಲ್‌ಗಳಿಗಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾದ ಕಾನೂನುಬದ್ಧ ಅರ್ಜಿ.",
    copyPetition: "📋 ಮನವಿಯನ್ನು ನಕಲಿಸಿ",
    submitEngine: "ದಾಖಲಿಸಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ➔",
    timelineTitle: "ಇಲಾಖಾ ಆಡಿಟ್ ಕಾಲಮಿತಿ",
    timelineSubtitle: "ಬದಲಾಯಿಸಲಾಗದ ಡಿಜಿಟಲ್ ಸಮಯ ದಾಖಲೆಗಳು",
    fileAnother: "➕ ಮತ್ತೊಂದು ದೂರನ್ನು ದಾಖಲಿಸಿ",
    viewExplorer: "📂 ಎಲ್ಲಾ ಪ್ರಕರಣಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    casesTitle: "ಲೈವ್ SQLite ಪ್ರಕರಣಗಳ ವೀಕ್ಷಕ",
    casesSubtitle: "ದಾಖಲಾದ ದೂರುಗಳು, ಇಲಾಖಾ ಪ್ರಗತಿ ಮತ್ತು ಆಡಿಟ್ ಲಾಗ್‌ಗಳು.",
    refreshCases: "🔄 ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    thCaseId: "ಪ್ರಕರಣ ID",
    thScheme: "ಯೋಜನೆ",
    thComplaint: "ದೂರಿನ ಸಾರಾಂಶ",
    thDept: "ನಿಯೋಜಿತ ಇಲಾಖೆ",
    thStatus: "ಸ್ಥಿತಿ",
    thConfirmation: "ನಾಗರಿಕರ ದೃಢೀಕರಣ",
    metricsTitle: "ಸಾರ್ವಜನಿಕ ಆಡಳಿತ ಪಾರದರ್ಶಕತೆ ಮತ್ತು ಪರಿಹಾರ ವಿಶ್ಲೇಷಣೆ",
    metricsSubtitle: "ಕಾಗದದ ಮೇಲಿನ ವಿಲೇವಾರಿ ಮತ್ತು ನಿಜವಾದ ನಾಗರಿಕ ಪರಿಹಾರದ ನಡುವಿನ ಅಂತರದ ವಿಶ್ಲೇಷಣೆ.",
    refreshMetrics: "🔄 ಮೆಟ್ರಿಕ್ಸ್ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    metricLabel1: "ಒಟ್ಟು ದಾಖಲಾದ ದೂರುಗಳು",
    metricSub1: "4 ಪ್ರಮುಖ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳಲ್ಲಿ",
    metricLabel2: "ಕಾಗದದಲ್ಲಿ ವಿಲೇವಾರಿಯಾದವು",
    metricSub2: "ಇಲಾಖೆಗಳಿಂದ ಮುಚ್ಚಲ್ಪಟ್ಟವು",
    metricLabel3: "ನೈಜ ನಾಗರಿಕ ಪರಿಹಾರ ದರ",
    metricSub3: "ಹಣ ಜಮೆಯಾಗಿದ್ದನ್ನು ದೃಢಪಡಿಸಿದವರು",
    metricLabel4: "CPGRAMS ಮೊದಲ ಮೇಲ್ಮನವಿಗಳು",
    metricSub4: "ಪರಿಹಾರವಾಗದ ಕಾರಣ ರಚಿಸಲಾದವು",
    metricLabel5: "ಇಲಾಖೆ ನಿಯೋಜನೆ ನಿಖರತೆ",
    metricSub5: "ನಿಯಮ ಆಧಾರಿತ ನಿಖರ ಹೊಂದಾಣಿಕೆ",
    metricsBreakdownTitle: "ಯೋಜನೆವಾರು ದೂರು ವಿತರಣೆ"
  },
  ml: {
    brandTagline: "വ്യക്തവും സുതാര്യവുമായ ഇന്ത്യൻ പൗര പരാതി പരിഹാര & അപ്പീൽ പ്ലാറ്റ്‌ഫോം",
    assistantTab: "🏛️ പരാതി പരിഹാര സഹായി",
    casesTab: "📂 നിലവിലെ കേസുകൾ",
    metricsTab: "📊 ഭരണ വിശകലനം",
    pitchBrief: "🏆 സംഗ്രഹവും മാനദണ്ഡങ്ങളും",
    apiDocs: "⚙️ API വിവരങ്ങൾ",
    judgeTitle: "വിദഗ്ദ്ധ പരിശോധനാ തട്ടകം:",
    judgeSubtitle: "ഒറ്റ ക്ലിക്കിൽ മാതൃകാ കേസുകൾ ലോഡ് ചെയ്തു പരിശോധിക്കാം",
    step1: "പദ്ധതി",
    step2: "വിവരങ്ങൾ",
    step3: "പരിശോധന",
    step4: "വകുപ്പ്",
    step5: "രേഖകൾ",
    step6: "ഹർജി",
    step7: "നിലവിലെ അവസ്ഥ",
    startTitle: "ഏത് സർക്കാർ പദ്ധതിയുടെ ആനുകൂല്യമാണ് തടസ്സപ്പെട്ടത്?",
    startSubtitle: "മുൻകൂർ യോഗ്യതാ പരിശോധന ആരംഭിക്കുന്നതിന് താഴെ നിന്ന് പദ്ധതി തിരഞ്ഞെടുക്കുക.",
    categories: {
      pm_kisan_payment_failure: {
        title: "പി.എം-കിസാൻ ഗഡു ലഭിച്ചില്ല",
        desc: "₹2,000 ഗഡു മുടങ്ങി, NPCI ആധാർ ബാങ്ക് സീഡിങ് അല്ലെങ്കിൽ ഭൂമി രേഖകളിലെ പൊരുത്തക്കേട്.",
        badge: "നേരിട്ടുള്ള ആനുകൂല്യ കൈമാറ്റം (DBT)"
      },
      epfo_claim_rejected: {
        title: "EPFO പി.എഫ് ക്ലെയിം നിരസിക്കപ്പെട്ടു",
        desc: "ആധാറുമായി പേരിൽ പൊരുത്തക്കേട്, ബാങ്ക് KYC അല്ലെങ്കിൽ ജോലി അവസാനിപ്പിച്ച തീയതി പ്രശ്നങ്ങൾ.",
        badge: "തൊഴിലാളി പ്രൊവിഡന്റ് ഫണ്ട്"
      },
      income_tax_refund_delayed: {
        title: "ആദായനികുതി റീഫണ്ട് വൈകുന്നു",
        desc: "സെക്ഷൻ 245 നോട്ടീസ് അല്ലെങ്കിൽ ഫോം 26AS പൊരുത്തക്കേട് കാരണം റീഫണ്ട് തടസ്സപ്പെട്ടു.",
        badge: "ആദായനികുതി വകുപ്പ് (CPC)"
      },
      scholarship_nsp_payment_stuck: {
        title: "NSP സ്കോളർഷിപ്പ് ലഭിച്ചില്ല",
        desc: "കോളേജ് അല്ലെങ്കിൽ ജില്ലാ/സംസ്ഥാന നോഡൽ ഓഫീസർ പരിശോധനാ തലത്തിൽ തടസ്സപ്പെട്ടു.",
        badge: "ദേശീയ സ്കോളർഷിപ്പ് പോർട്ടൽ"
      }
    },
    intakeTitle: "പരാതി വിവരങ്ങൾ രേഖപ്പെടുത്തുക",
    intakeSubtitle: "ലഭിക്കാനുള്ള തുകയുടെയോ ആനുകൂല്യത്തിന്റെയോ വിശദാംശങ്ങൾ നൽകുക.",
    complaintLabel: "പരാതി വിവരണം / പ്രശ്നം",
    complaintPlaceholder: "പ്രശ്നം വിവരിക്കുക (ഉദാ: എന്റെ പി.എം-കിസാൻ 14-ാം ഗഡു ബാങ്ക് അക്കൗണ്ടിൽ എത്തിയില്ല...)",
    voiceInput: "🎙️ വോയ്‌സ് ഇൻപുട്ട്",
    nameLabel: "പൗരന്റെ / ഗുണഭോക്താവിന്റെ പേര്",
    idLabel: "രജിസ്ട്രേഷൻ / ഐഡി നമ്പർ",
    stateLabel: "സംസ്ഥാനം / കേന്ദ്രഭരണ പ്രദേശം",
    dateLabel: "അവസാനം പണം ലഭിച്ച തീയതി",
    back: "⬅ പിന്നോട്ട്",
    continueDiag: "പരിശോധനയിലേക്ക് തുടരുക ➔",
    diagTitle: "വ്യവസ്ഥാപിത യോഗ്യതാ പരിശോധനകൾ",
    diagSubtitle: "വകുപ്പിലേക്ക് അയയ്ക്കുന്നതിന് മുൻപായി എല്ലാ സാങ്കേതിക വ്യവസ്ഥകളും പാലിച്ചിട്ടുണ്ടെന്ന് ഉറപ്പാക്കുന്നു.",
    continueRouting: "വകുപ്പ് നിർണ്ണയത്തിലേക്ക് ➔",
    routingTitle: "സുതാര്യമായ വകുപ്പ് നിർണ്ണയം",
    routingSubtitle: "നിങ്ങളുടെ പരാതി കൃത്യമായ മന്ത്രാലയത്തിലേക്ക് എത്തിക്കുന്ന നിയമ സംവിധാനം.",
    continueEvidence: "രേഖകളുടെ പരിശോധനയിലേക്ക് ➔",
    evidenceTitle: "രേഖകളുടെ പൂർണ്ണതയും തയ്യാറെടുപ്പ് സ്കോറും",
    evidenceSubtitle: "പരാതി തള്ളിക്കളയാതിരിക്കാൻ ആവശ്യമായ രേഖകൾ ഉറപ്പുവരുത്തുക.",
    readinessScoreLabel: "രേഖാ തയ്യാറെടുപ്പ് സ്കോർ",
    generatePetition: "ഔദ്യോഗിക പരാതി തയ്യാറാക്കുക ➔",
    petitionTitle: "ഔദ്യോഗിക പൗര പരാതി ഹർജി",
    petitionSubtitle: "CPGRAMS പോർട്ടലിനായുള്ള നിയമപരമായി തയ്യാറാക്കിയ ഹർജി.",
    copyPetition: "📋 ഹർജി പകർപ്പാവകാശം",
    submitEngine: "രേഖപ്പെടുത്തി ട്രാക്ക് ചെയ്യുക ➔",
    timelineTitle: "വകുപ്പ്തല പരിശോധനാ സമയക്രമം",
    timelineSubtitle: "മാറ്റമില്ലാത്ത ഡിജിറ്റൽ സമയരേഖകൾ",
    fileAnother: "➕ മറ്റൊരു പരാതി നൽകുക",
    viewExplorer: "📂 എല്ലാ കേസുകളും കാണുക",
    casesTitle: "നിലവിലെ SQLite കേസുകൾ",
    casesSubtitle: "രേഖപ്പെടുത്തിയ പരാതികളും വകുപ്പുതല നടപടികളും തത്സമയം കാണാം.",
    refreshCases: "🔄 പുതുക്കുക",
    thCaseId: "കേസ് ഐഡി",
    thScheme: "പദ്ധതി",
    thComplaint: "പരാതി സംഗ്രഹം",
    thDept: "ചുമതലപ്പെടുത്തിയ വകുപ്പ്",
    thStatus: "നിലവിലെ അവസ്ഥ",
    thConfirmation: "പൗരന്റെ സ്ഥിരീകരണം",
    metricsTitle: "പൊതുഭരണ സുതാര്യതയും പരിഹാര വിശകലനവും",
    metricsSubtitle: "വകുപ്പുതല ഫയൽ ക്ലോസിംഗും യഥാർത്ഥ പൗര ആശ്വാസവും തമ്മിലുള്ള വ്യത്യാസം.",
    refreshMetrics: "🔄 വിശകലനം പുതുക്കുക",
    metricLabel1: "ആകെ ലഭിച്ച പരാതികൾ",
    metricSub1: "4 പ്രധാന കേന്ദ്ര പദ്ധതികളിൽ",
    metricLabel2: "തീർപ്പാക്കിയതായി രേഖപ്പെടുത്തിയത്",
    metricSub2: "വകുപ്പുകൾ ക്ലോസ് ചെയ്തവ",
    metricLabel3: "യഥാർത്ഥ പൗര പരിഹാര നിരക്ക്",
    metricSub3: "പണം ലഭിച്ചതായി സ്ഥിരീകരിച്ചവർ",
    metricLabel4: "CPGRAMS ഒന്നാം അപ്പീലുകൾ",
    metricSub4: "പരിഹാരമില്ലാതെ അടച്ചതിനാൽ നൽകിയവ",
    metricLabel5: "കൃത്യമായ വകുപ്പ് നിർണ്ണയം",
    metricSub5: "നിയമാധ�  if (!diagnosticRules || !diagnosticRules.questions) {
    container.innerHTML = '<div style="color:var(--danger)">Unable to load diagnostic rules.</div>';
    return;
  }

  container.innerHTML = '';
  const questions = diagnosticRules.questions;

  // Call the backend /diagnose endpoint to evaluate current state
  let diagResult = null;
  try {
    const res = await fetch(`${API_BASE}/diagnose/${selectedCategory}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: diagnosticAnswers })
    });
    if (res.ok) {
      diagResult = await res.json();
    }
  } catch (e) {
    console.warn("Diagnose call failed", e);
  }

  const yesTxt = currentLang === 'hi' ? '✓ हाँ, सत्यापित' : currentLang === 'ta' ? '✓ ஆம், சரிபார்க்கப்பட்டது' : currentLang === 'te' ? '✓ అవును, ధృవీకరించబడింది' : currentLang === 'kn' ? '✓ ಹೌದು, ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : currentLang === 'ml' ? '✓ അതെ, പരിശോധിച്ചു' : '✓ Yes, Verified';
  const noTxt = currentLang === 'hi' ? '✕ नहीं / अधूरा' : currentLang === 'ta' ? '✕ இல்லை / முழுமையடையவில்லை' : currentLang === 'te' ? '✕ కాదు / పూర్తికాలేదు' : currentLang === 'kn' ? '✕ ಇಲ್ಲ / ಅಪೂರ್ಣ' : currentLang === 'ml' ? '✕ അല്ല / അപൂർണ്ണമാണ്' : '✕ No / Not Done';

  questions.forEach((q, idx) => {
    const isAnswered = diagnosticAnswers.hasOwnProperty(q.key);
    const ans = diagnosticAnswers[q.key];
    const isBlocking = isAnswered && ((q.blockingAnswer === "no" && ans === false) || (q.blockingAnswer === "yes" && ans === true));
    const isGood = isAnswered && !isBlocking;

    const passLabel = currentLang === 'hi' ? '✓ उत्तीर्ण' : currentLang === 'ta' ? '✓ தேர்ச்சி' : currentLang === 'te' ? '✓ ఉత్తీర్ణత' : currentLang === 'kn' ? '✓ ಯಶಸ್ವಿ' : currentLang === 'ml' ? '✓ വിജയിച്ചു' : '✓ PASSED';
    const blockLabel = currentLang === 'hi' ? '⚠️ अवरुद्ध' : currentLang === 'ta' ? '⚠️ தடையானது' : currentLang === 'te' ? '⚠️ నిలిపివేయబడింది' : currentLang === 'kn' ? '⚠️ ಅಡಚಣೆ' : currentLang === 'ml' ? '⚠️ തടಸ್സം' : '⚠️ BLOCKED';
    const pendingLabel = currentLang === 'hi' ? '• प्रतीक्षारत' : currentLang === 'ta' ? '• நிலுவையில்' : currentLang === 'te' ? '• పెండింగ్' : currentLang === 'kn' ? '• ಬಾಕಿ' : currentLang === 'ml' ? '• കാത്തിരിക്കുന്നു' : '• PENDING';

    const node = document.createElement('div');
    node.className = `diag-node ${isAnswered ? (isGood ? 'pass' : 'blocked') : (idx === currentDiagIndex ? 'active' : '')}`;
    
    node.innerHTML = `
      <div class="diag-node-header">
        <div>
          <div style="font-size:0.75rem;font-weight:800;color:${isGood ? 'var(--success)' : isBlocking ? 'var(--danger)' : 'var(--primary)'};text-transform:uppercase;letter-spacing:0.06em;">
            ${currentLang === 'hi' ? `पूर्व-शर्त जांच #${idx + 1}` : currentLang === 'ta' ? `முன்நிபந்தனை சோதனை #${idx + 1}` : currentLang === 'te' ? `అర్హత తనిఖీ #${idx + 1}` : currentLang === 'kn' ? `ಪೂರ್ವಭಾವಿ ತಪಾಸಣೆ #${idx + 1}` : currentLang === 'ml' ? `യോഗ്യതാ പരിശോധന #${idx + 1}` : `Prerequisite Check #${idx + 1}`} ${isGood ? passLabel : isBlocking ? blockLabel : pendingLabel}
          </div>
          <div class="diag-node-title" style="margin-top:0.25rem;">${q.question}</div>
          <div class="diag-node-desc">${q.helper}</div>
        </div>
      </div>
      <div class="diag-options">
        <button class="diag-btn yes ${ans === true ? 'selected' : ''}" onclick="recordDiagAnswer('${q.key}', true, ${idx})">
          ${yesTxt}
        </button>
        <button class="diag-btn no ${ans === false ? 'selected' : ''}" onclick="recordDiagAnswer('${q.key}', false, ${idx})">
          ${noTxt}
        </button>
      </div>
      ${isBlocking ? `
        <div class="remedy-box">
          <div class="remedy-title">
            <span>⚠️</span> <span>${currentLang === 'hi' ? 'आवश्यक सुधारात्मक कार्रवाई' : currentLang === 'ta' ? 'தேவையான திருத்த நடவடிக்கை' : currentLang === 'te' ? 'అవసరమైన దిద్దుబాటు చర్య' : currentLang === 'kn' ? 'ಅಗತ್ಯ ತಿದ್ದುಪಡಿ ಕ್ರಮ' : currentLang === 'ml' ? 'ആവശ്യമായ തിരുത്തൽ നടപടി' : 'Action Required'}: ${q.fixTitle}</span>
          </div>
          <div style="font-size:0.85rem;color:#78350F;margin-top:0.35rem;">${q.fixIntro}</div>
          <ul class="remedy-list">
            ${(q.fixItems || []).map(item => `<li>${item}</li>`).join('')}
          </ul>
          <div style="font-size:0.8rem;font-weight:700;color:var(--saffron-dark);margin-top:0.5rem;padding-top:0.4rem;border-top:1px solid rgba(232,121,59,0.3);">
            ${currentLang === 'hi' ? 'यह क्यों महत्वपूर्ण है' : currentLang === 'ta' ? 'இது ஏன் முக்கியம்' : currentLang === 'te' ? 'ఇది ఎందుకు ముఖ్యం' : currentLang === 'kn' ? 'ಇದು ಏಕೆ ಮುಖ್ಯ' : currentLang === 'ml' ? 'ഇത് എന്തുകൊണ്ട് പ്രധാനം' : 'Why this matters'}: ${q.recommendedAction}
          </div>
        </div>
      ` : ''}
    `;

    container.appendChild(node);
  });

  // Diagnostic Summary Banner
  const summaryBox = document.getElementById('diagSummaryBox');
  if (summaryBox) {
    if (diagResult) {
      if (diagResult.outcome === 'ready_to_file') {
        summaryBox.innerHTML = `
          <div style="background:var(--success-bg);border:2px solid var(--success);border-radius:var(--radius-md);padding:1.25rem;margin-top:1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;">
            <div>
              <div style="font-weight:800;color:var(--success);font-size:1.1rem;">✓ ${currentLang === 'hi' ? 'सभी पूर्व-शर्तें सत्यापित — आवेदन हेतु तैयार' : currentLang === 'ta' ? 'அனைத்து நிபந்தனைகளும் சரிபார்க்கப்பட்டன — மனு அளிக்கத் தயார்' : currentLang === 'te' ? 'అన్ని అర్హతలు ధృవీకరించబడ్డాయి — దరఖాస్తుకు సిద్ధం' : currentLang === 'kn' ? 'ಎಲ್ಲಾ ಷರತ್ತುಗಳು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ — ಸಲ್ಲಿಕೆಗೆ ಸಿದ್ಧ' : currentLang === 'ml' ? 'എല്ലാ നിബന്ധനകളും പൂർത്തിയായി — ഹർജിക്ക് തയ്യാറാണ്' : 'All Prerequisites Verified — Ready to File'}</div>
              <div style="font-size:0.88rem;color:#14532D;margin-top:0.2rem;">${currentLang === 'hi' ? 'आपकी शिकायत विभागीय प्रेषण हेतु पूरी तरह से तैयार है।' : currentLang === 'ta' ? 'உங்கள் புகார் துறை ஒதுக்கீட்டிற்கு முற்றிலும் தயாராக உள்ளது.' : currentLang === 'te' ? 'మీ ఫిర్యాదు శాఖకు పంపడానికి సిద్ధంగా ఉంది.' : currentLang === 'kn' ? 'ನಿಮ್ಮ ದೂರು ಇಲಾಖೆಗೆ ಸಲ್ಲಿಸಲು ಸಿದ್ಧವಾಗಿದೆ.' : currentLang === 'ml' ? 'നിങ്ങളുടെ പരാതി വകുപ്പിലേക്ക് അയയ്ക്കാൻ തയ്യാറാണ്.' : 'Your complaint satisfies all prerequisite criteria and is clear for official department routing.'}</div>
            </div>
            <button class="btn-primary" onclick="goToStep(4)">${dict.continueRouting}</button>
          </div>
        `;
      } else {
        summaryBox.innerHTML = `
          <div style="background:var(--warning-bg);border:2px solid var(--warning);border-radius:var(--radius-md);padding:1.25rem;margin-top:1.5rem;">
            <div style="font-weight:800;color:#92400E;font-size:1.05rem;">⚠️ ${currentLang === 'hi' ? 'प्रारंभिक तकनीकी रुकावट पहचानी गई' : currentLang === 'ta' ? 'முன்நிபந்தனை முட்டுக்கட்டை கண்டறியப்பட்டது' : currentLang === 'te' ? 'ముందస్తు సాంకేతిక అడ్డంకి గుర్తించబడింది' : currentLang === 'kn' ? 'ತಾಂತ್ರಿಕ ಅಡಚಣೆ ಪತ್ತೆಯಾಗಿದೆ' : currentLang === 'ml' ? 'സാങ്കേതിക തടസ്സം കണ്ടെത്തി' : 'Prerequisite Bottleneck Detected'}</div>
            <div style="font-size:0.88rem;color:#78350F;margin-top:0.25rem;">
              <strong>${diagResult.recommendedDepartment}</strong>: ${diagResult.actionableFix || diagResult.reason}
            </div>
            <div style="margin-top:0.75rem;display:flex;gap:0.5rem;">
              <button class="btn-primary" onclick="goToStep(4)">${dict.continueRouting}</button>
            </div>
          </div>
        `;
      }
    }
  }
}

function recordDiagAnswer(key, value, idx) {
  diagnosticAnswers[key] = value;
  currentDiagIndex = idx + 1;
  renderDiagnosticTree();
}

// Step 4: Explainable Department Routing
async function triggerRouting() {
  const complaint = document.getElementById('complaintText').value || "My PM-KISAN installment has not arrived.";
  const cat = selectedCategory || 'pm_kisan_payment_failure';

  try {
    const res = await fetch(`${API_BASE}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, issueDescription: complaint })
    });
    if (res.ok) {
      routingResult = await res.json();
      renderRoutingDisplay(routingResult);
    }
  } catch (err) {
    console.warn("Routing API error", err);
  }
}

function renderRoutingDisplay(routing) {
  const container = document.getElementById('routingResultContainer');
  if (!container || !routing) return;

  const headerTxt = currentLang === 'hi' ? '🏛️ पारदर्शी एवं नियम-आधारित विभाग आवंटन' : currentLang === 'ta' ? '🏛️ வெளிப்படையான துறை ஒதுக்கீடு பொருத்தம்' : currentLang === 'te' ? '🏛️ పారదర్శక శాఖ కేటాయింపు' : currentLang === 'kn' ? '🏛️ ಪಾರದರ್ಶಕ ಇಲಾಖೆ ನಿಯೋಜನೆ' : currentLang === 'ml' ? '🏛️ സുതാര്യമായ വകുപ്പ് നിർണ്ണയം' : '🏛️ Explainable Intelligent Routing Match';
  const matchedTxt = currentLang === 'hi' ? 'सक्रिय नियम ट्रिगर' : currentLang === 'ta' ? 'செயலில் உள்ள விதி தூண்டுதல்' : currentLang === 'te' ? 'నియమ సరిపోలిక' : currentLang === 'kn' ? 'ಹೊಂದಿಕೆಯಾದ ನಿಯಮ' : currentLang === 'ml' ? 'പൊരുത്തപ്പെട്ട നിയമം' : 'Matched Rule Trigger';as not been credited. The portal status shows Aadhaar NPCI bank mapping is pending.",
      epfo_claim_rejected: "My EPFO claim for Form 19 was rejected because my name on the UAN portal does not match my Aadhaar card.",
      income_tax_refund_delayed: "My income tax refund for AY 2024-25 is delayed. A disputed Section 245 outstanding demand notice has blocked the disbursal.",
      scholarship_nsp_payment_stuck: "My NSP scholarship payment of ₹18,000 is stuck at the State and District Nodal Officer approval level."
    },
    hi: {
      pm_kisan_payment_failure: "मेरी पीएम-किसान की 14वीं ₹2,000 की किस्त बैंक खाते में नहीं आई है। पोर्टल पर एनपीसीआई आधार मैपिंग लंबित दिखा रहा है।",
      epfo_claim_rejected: "मेरा ईपीएफओ फॉर्म 19 पीएफ क्लेम अस्वीकृत हो गया है क्योंकि यूएएन रिकॉर्ड और आधार में नाम में अंतर है।",
      income_tax_refund_delayed: "मेरा आयकर रिफंड लंबित है। धारा 245 के तहत गलत मांग नोटिस के कारण भुगतान रोक दिया गया है।",
      scholarship_nsp_payment_stuck: "मेरी राष्ट्रीय छात्रवृत्ति (NSP) की ₹18,000 की राशि जिला नोडल अधिकारी स्तर पर अटकी हुई है।"
    },
    ta: {
      pm_kisan_payment_failure: "எனது பி.எம்-கிசான் 14-வது தவணை ரூ.2,000 வங்கி கணக்கில் வரவில்லை. போர்ட்டலில் NPCI ஆதார் இணைப்பு நிலுவையில் உள்ளது எனக் காட்டுகிறது.",
      epfo_claim_rejected: "எனது இ.பி.எஃப்.ஓ படிவம் 19 பி.எஃப் கோரிக்கை ஆதார் பெயர் முரண்பாடு காரணமாக நிராகரிக்கப்பட்டது.",
      income_tax_refund_delayed: "எனது வருமான வரி திரும்பப்பெறுதல் தொகை தாமதமாகியுள்ளது. பிரிவு 245 தவறான கோரிக்கை நோட்டீஸ் காரணமாக நிறுத்தப்பட்டுள்ளது.",
      scholarship_nsp_payment_stuck: "எனது என்.எஸ்.பி கல்வி உதவித்தொகை ரூ.18,000 மாவட்ட/மாநில அலுவலர் ஒப்புதல் பெறாமல் நிலுவையில் உள்ளது."
    },
    te: {
      pm_kisan_payment_failure: "నా పీఎం-కిసాన్ 14వ విడత ₹2,000 బ్యాంక్ ఖాతాలో జమ కాలేదు. పోర్టల్‌లో NPCI ఆధార్ మ్యాపింగ్ పెండింగ్‌లో ఉందని చూపుతోంది.",
      epfo_claim_rejected: "ఆధార్‌తో పేరు సరిపోలకపోవడం వల్ల నా EPFO ఫారమ్ 19 పీఎఫ్ క్లెయిమ్ తిరస్కరించబడింది.",
      income_tax_refund_delayed: "నా ఆదాయపు పన్ను రీఫండ్ ఆలస్యమైంది. సెక్షన్ 245 కింద నోటీసు కారణంగా చెల్లింపు ఆగిపోయింది.",
      scholarship_nsp_payment_stuck: "నా NSP స్కాలర్‌షిప్ మొత్తం ₹18,000 జిల్లా నోడల్ అధికారి ఆమోదం వద్ద నిలిచిపోయింది."
    },
    kn: {
      pm_kisan_payment_failure: "ನನ್ನ ಪಿಎಂ-ಕಿಸಾನ್ 14ನೇ ಕಂತು ₹2,000 ಖಾತೆಗೆ ಜಮೆಯಾಗಿಲ್ಲ. ಪೋರ್ಟಲ್‌ನಲ್ಲಿ NPCI ಆಧಾರ್ ಮ್ಯಾಪಿಂಗ್ ಬಾಕಿ ತೋರಿಸುತ್ತಿದೆ.",
      epfo_claim_rejected: "ಆಧಾರ್ ಜತೆ ಹೆಸರು ವ್ಯತ್ಯಾಸವಿರುವ ಕಾರಣ ನನ್ನ EPFO ಫಾರ್ಮ್ 19 ಕ್ಲೈಮ್ ತಿರಸ್ಕರಿಸಲ್ಪಟ್ಟಿದೆ.",
      income_tax_refund_delayed: "ನನ್ನ ಆದಾಯ ತೆರಿಗೆ ಮರುಪಾವತಿ ವಿಳಂಬವಾಗಿದೆ. ಸೆಕ್ಷನ್ 245 ನೋಟಿಸ್ ಕಾರಣದಿಂದ ಹಣ ಸ್ಥಗಿತಗೊಂಡಿದೆ.",
      scholarship_nsp_payment_stuck: "ನನ್ನ NSP ವಿದ್ಯಾರ್ಥಿವೇತನದ ₹18,000 ಮೊತ್ತವು ಜಿಲ್ಲಾ ನೋಡಲ್ ಅಧಿಕಾರಿ ಹಂತದಲ್ಲಿ ಬಾಕಿ ಇದೆ."
    },
    ml: {
      pm_kisan_payment_failure: "എന്റെ പി.എം-കിസാൻ 14-ാം ഗഡു ₹2,000 ബാങ്ക് അക്കൗണ്ടിൽ എത്തിയില്ല. പോർട്ടലിൽ NPCI ആധാർ സീഡിംഗ് പെൻഡിംഗ് കാണിക്കുന്നു.",
      epfo_claim_rejected: "ആധാറുമായി പേരിൽ വ്യത്യാസമുള്ളതിനാൽ എന്റെ EPFO ഫോം 19 ക്ലെയിം നിരസിക്കപ്പെട്ടു.",
      income_tax_refund_delayed: "എന്റെ ആദായനികുതി റീഫണ്ട് വൈകുന്നു. സെക്ഷൻ 245 നോട്ടീസ് കാരണം തുക തടസ്സപ്പെട്ടിരിക്കുകയാണ്.",
      scholarship_nsp_payment_stuck: "എന്റെ NSP സ്കോളർഷിപ്പ് തുകയായ ₹18,000 ജില്ലാ നോഡൽ ഓഫീസറുടെ അനുമതിക്കായി കാത്തിരിക്കുകയാണ്."
    }
  };

  const langDict = samples[currentLang] || samples.en;
  textarea.value = langDict[cat] || samples.en[cat];
  showToast(currentLang === 'hi' ? 'वॉयस इनपुट नमूना लोड किया गया!' : currentLang === 'ta' ? 'குரல் மாதிரி ஏற்றப்பட்டது!' : currentLang === 'te' ? 'వాయిస్ నమూనా లోడ్ చేయబడింది!' : currentLang === 'kn' ? 'ಧ್ವನಿ ಮಾದರಿ ಲೋಡ್ ಆಗಿದೆ!' : currentLang === 'ml' ? 'വോയ്‌സ് സാമ്പിൾ ലോഡ് ചെയ്തു!' : 'Sample voice audio transcription loaded!');
}

// Step 3: Diagnostic Tree Rendering
async function renderDiagnosticTree() {
  const dict = i18n[currentLang] || i18n.en;
  const container = document.getElementById('diagnosticTreeContainer');
  container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">${currentLang === 'hi' ? 'प्रणाली से पूर्व-शर्त जांच लोड की जा रही है...' : currentLang === 'ta' ? 'இயந்திரத்திலிருந்து சோதனைகள் ஏற்றப்படுகின்றன...' : currentLang === 'te' ? 'సిస్టమ్ నుండి తనిఖీలు లోడ్ అవుతున్నాయి...' : currentLang === 'kn' ? 'ತಪಾಸಣೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : currentLang === 'ml' ? 'പരിശോധനകൾ ലോഡ് ചെയ്യുന്നു...' : 'Loading ordered prerequisite checks from engine...'}</div>`;

  if (!diagnosticRules) {
    await loadDiagnosticRules(selectedCategory || 'pm_kisan_payment_failure');
  }

  if (!diagnosticRules || !diagnosticRules.questions) {
    container.innerHTML = '<div style="color:var(--danger)">Unable to load diagnostic rules.</div>';
    return;
  }

  container.  // PROMINENT BOTTOM ACTION CARD (Advance status OR Citizen resolution prompt OR Verified Closure)
  const isConfirmedYes = (caseObj.citizen_confirmed === 'yes' || caseObj.citizenConfirmed === 'yes');
  const actionCard = document.getElementById('advanceActionCard');
  if (actionCard) {
    const nextTransitions = {
      submitted: "ROUTED",
      routed: "UNDER PROCESS",
      under_process: "DISPOSED"
    };
    const nextStage = nextTransitions[caseObj.status];

    if (isConfirmedYes) {
      const closedTitle = currentLang === 'hi' ? '🎉 शिकायत सफलतापूर्वक निस्तारित एवं नागरिक द्वारा सत्यापित' : currentLang === 'ta' ? '🎉 புகார் வெற்றிகரமாக தீர்க்கப்பட்டு குடிமக்களால் உறுதிப்படுத்தப்பட்டது' : currentLang === 'te' ? '🎉 ఫిర్యాదు విజయవంతంగా పరిష్కరించబడి ధృవీకరించబడింది' : currentLang === 'kn' ? '🎉 ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಹಾರಗೊಂಡು ನಾಗರಿಕರಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ' : currentLang === 'ml' ? '🎉 പരാതി വിജയകരമായി പരിഹരിച്ച് പൗരൻ സ്ഥിരീകരിച്ചു' : '🎉 Grievance Successfully Resolved & Verified';
      const closedBadge = currentLang === 'hi' ? 'नागरिक सत्यापन पूर्ण · 100% समाधान' : currentLang === 'ta' ? 'குடிமக்கள் உறுதிப்படுத்தல் நிறைவுற்றது' : currentLang === 'te' ? 'పౌర ధృవీకరణ పూర్తయింది' : currentLang === 'kn' ? 'ನಾಗರಿಕ ದೃಢೀಕರಣ ಪೂರ್ಣಗೊಂಡಿದೆ' : currentLang === 'ml' ? 'പൗര സ്ഥിരീകരണം പൂർത്തിയായി' : 'Citizen Verified Redressal · 100% Closure Guarantee';
      const closedSub = currentLang === 'hi' ? 'आपने बैंक खाते में धनराशि/सेवा प्राप्ति की पुष्टि कर दी है। यह मामला डिजिटल ऑडिट ट्रेल के साथ आधिकारिक रूप से बंद है।' : currentLang === 'ta' ? 'வங்கி கணக்கில் நிதி/சேவை கிடைத்ததை உறுதிப்படுத்தியுள்ளீர்கள். இந்த வழக்கு முறைப்படி தீர்க்கப்பட்டு மூடப்பட்டுள்ளது.' : currentLang === 'te' ? 'బ్యాంకు ఖాతాలో నిధులు అందినట్లు ధృవీకరించారు. ఈ కేసు అధికారికంగా పరిష్కరించబడింది.' : currentLang === 'kn' ? 'ಖಾತೆಗೆ ಹಣ ಜಮೆಯಾಗಿರುವುದನ್ನು ನೀವು ದೃಢಪಡಿಸಿದ್ದೀರಿ. ಈ ಪ್ರಕರಣವನ್ನು ಅಧಿಕೃತವಾಗಿ ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ.' : currentLang === 'ml' ? 'ബാങ്ക് അക്കൗണ്ടിൽ പണം ലഭിച്ചതായി സ്ഥിരീകരിച്ചു. പരാതി ഔദ്യോഗികമായി തീർപ്പാക്കി ക്ലോസ് ചെയ്തു.' : 'You confirmed receipt of your entitled money or service. This grievance has been officially verified and closed in the NyayaFlow registry with an immutable audit trail.';
      const viewAllBtnTxt = currentLang === 'hi' ? '📂 केस एक्सप्लोरर में देखें' : currentLang === 'ta' ? '📂 வழக்குகளை காண்க' : currentLang === 'te' ? '📂 కేసుల జాబితా' : currentLang === 'kn' ? '📂 ಪ್ರಕರಣಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : currentLang === 'ml' ? '📂 കേസുകൾ കാണുക' : '📂 View in Case Explorer';
      const newCaseBtnTxt = currentLang === 'hi' ? '➕ नई शिकायत दर्ज करें' : currentLang === 'ta' ? '➕ புதிய புகார் பதிவு' : currentLang === 'te' ? '➕ కొత్త ఫిర్యాదు' : currentLang === 'kn' ? '➕ ಮತ್ತೊಂದು ದೂರು' : currentLang === 'ml' ? '➕ പുതിയ പരാതി' : '➕ File Another Grievance';
      const exportPdfBtnTxt = currentLang === 'hi' ? '📄 निस्तारण रसीद (PDF)' : currentLang === 'ta' ? '📄 தீர்வு ரசீது (PDF)' : currentLang === 'te' ? '📄 పరిష్కార రశీదు' : currentLang === 'kn' ? '📄 ಪರಿಹಾರ ರಶೀದಿ (PDF)' : currentLang === 'ml' ? '📄 രസീത് (PDF)' : '📄 Download Closure PDF';

      actionCard.innerHTML = `
        <div style="background:linear-gradient(135deg, #065F46 0%, #047857 100%);color:#fff;border-radius:var(--radius-lg);padding:1.5rem 1.75rem;box-shadow:0 8px 24px rgba(6,95,70,0.25);border:1.5px solid #10B981;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
            <div style="max-width:680px;">
              <div style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.3rem 0.75rem;background:rgba(255,255,255,0.18);border-radius:999px;font-size:0.78rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#A7F3D0;margin-bottom:0.5rem;">
                <span>🛡️</span> <span>${closedBadge}</span>
              </div>
              <div style="font-size:1.3rem;font-weight:900;line-height:1.3;">${closedTitle}</div>
              <p style="font-size:0.9rem;color:#D1FAE5;margin-top:0.4rem;line-height:1.5;">${closedSub}</p>
            </div>
          </div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,0.2);">
            <button class="btn-secondary" onclick="switchView('cases'); document.querySelectorAll('.nav-tab').forEach(t=>t.classList.toggle('active', t.dataset.view==='cases'));" style="background:#fff;color:#065F46;border-color:#fff;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;">
              ${viewAllBtnTxt}
            </button>
            <button class="btn-secondary" onclick="goToStep(1)" style="background:rgba(255,255,255,0.18);color:#fff;border-color:rgba(255,255,255,0.4);font-weight:800;cursor:pointer;">
              ${newCaseBtnTxt}
            </button>
            <button class="btn-secondary" onclick="exportPetitionPdf()" style="background:rgba(255,255,255,0.18);color:#fff;border-color:rgba(255,255,255,0.4);font-weight:800;cursor:pointer;">
              ${exportPdfBtnTxt}
            </button>
          </div>
        </div>
      `;
    } else if (nextStage) {
      const demoActionTxt = currentLang === 'hi' ? '⚡ मुख्य इंटरैक्टिव डेमो एक्शन' : currentLang === 'ta' ? '⚡ முதன்மை ஊடாடும் செயல்முறை' : currentLang === 'te' ? '⚡ ప్రధాన ఇంటరాక్టివ్ డెమో చర్య' : currentLang === 'kn' ? '⚡ ಪ್ರಮುಖ ಸಂವಾದಾತ್ಮಕ ಡೆಮೊ ಕ್ರಿಯೆ' : currentLang === 'ml' ? '⚡ പ്രധാന ഇന്ററാക്ടീവ് ഡെമോ' : '⚡ Primary Interactive Demo Action';
      const simTxt = currentLang === 'hi' ? 'विभागीय प्रगति का अनुकरण करें' : currentLang === 'ta' ? 'துறை முன்னேற்றத்தை உருவகப்படுத்துங்கள்' : currentLang === 'te' ? 'శాఖ పురోగతిని అనుకరించండి' : currentLang === 'kn' ? 'ಇಲಾಖಾ ಪ್ರಗತಿಯನ್ನು ಅನುಕರಿಸಿ' : currentLang === 'ml' ? 'വകുപ്പുതല നടപടി മുന്നോട്ട് കൊണ്ടുപോകുക' : 'Simulate Department Progression';
      const advanceBtnTxt = currentLang === 'hi' ? `⏩ विभागीय स्थिति आगे बढ़ाएं (➔ ${nextStage})` : currentLang === 'ta' ? `⏩ துறை நிலையை முன்னேற்றுங்கள் (➔ ${nextStage})` : currentLang === 'te' ? `⏩ శాఖ స్థితిని ముందుకు తీసుకెళ్లండి (➔ ${nextStage})` : currentLang === 'kn' ? `⏩ ಇಲಾಖಾ ಸ್ಥಿತಿಯನ್ನು ಮುನ್ನಡೆಸಿ (➔ ${nextStage})` : currentLang === 'ml' ? `⏩ വകുപ്പ് നടപടി അടുത്ത ഘട്ടത്തിലേക്ക് (➔ ${nextStage})` : `⏩ Advance Department Status (➔ ${nextStage})`;

      actionCard.innerHTML = `
        <div style="background:linear-gradient(135deg, #0F766E 0%, #134E4A 100%);color:#fff;border-radius:var(--radius-lg);padding:1.5rem 1.75rem;box-shadow:var(--shadow-md);">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.25rem;">
            <div>
              <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#99F6E4;">${demoActionTxt}</div>
              <div style="font-size:1.2rem;font-weight:900;margin-top:0.25rem;">${simTxt}</div>
              <p style="font-size:0.85rem;color:#CCFBF1;margin-top:0.15rem;">Next: <strong>${nextStage}</strong></p>
            </div>
            <button id="mainAdvanceBtn" class="btn-sandbox" style="font-size:1rem;padding:0.85rem 1.75rem;background:#E8793B;box-shadow:0 4px 14px rgba(0,0,0,0.25);" onclick="advanceCaseStatus(${caseObj.id})">
              ${advanceBtnTxt}
            </button>
          </div>
        </div>
      `;
    } else if (caseObj.status === 'disposed') {
      const redTitle = currentLang === 'hi' ? 'नागरिक समाधान सत्यापन (न्यायफ्लो कोर निवारण)' : currentLang === 'ta' ? 'குடிமக்கள் தீர்வு உறுதிப்படுத்தல் (முக்கிய குறைதீர்ப்பு)' : currentLang === 'te' ? 'పౌర పరిష్కార ధృవీకరణ (ప్రధాన న్యాయ వేదిక)' : currentLang === 'kn' ? 'ನಾಗರಿಕ ಪರಿಹಾರ ದೃಢೀಕರಣ' : currentLang === 'ml' ? 'പൗര പരിഹാര സ്ഥിരീകരണം' : 'Citizen Resolution Verification (Core NyayaFlow Redressal)';
      const redSub = currentLang === 'hi' ? 'विभाग ने इस शिकायत को "निस्तारित" (Disposed) चिह्नित किया है। क्या आपको वास्तव में बैंक खाते में पैसा/सेवा प्राप्त हुई?' : currentLang === 'ta' ? 'துறை இந்த புகாரை "முடிக்கப்பட்டது" என குறித்தது. உங்கள் வங்கி கணக்கில் உண்மையில் பணம் கிடைத்ததா?' : currentLang === 'te' ? 'శాఖ ఈ ఫిర్యాదును "పరిష్కరించబడింది"గా గుర్తించింది. మీ బ్యాంక్ ఖాతాలో నిజంగా నగదు జమయిందా?' : currentLang === 'kn' ? 'ಇಲಾಖೆಯು ದೂರನ್ನು "ವಿಲೇವಾರಿ" ಎಂದು ಗುರುತಿಸಿದೆ. ನಿಮ್ಮ ಖಾತೆಗೆ ಹಣ ಜಮೆಯಾಗಿದೆಯೇ?' : currentLang === 'ml' ? 'വകുപ്പ് പരാതി തീർപ്പാക്കിയതായി രേഖപ്പെടുത്തി. നിങ്ങളുടെ ബാങ്ക് അക്കൗണ്ടിൽ പണം ലഭിച്ചോ?' : 'The department marked this complaint as "Disposed". Did you actually receive your entitled money or service in your bank account?';
      const yesBtn = currentLang === 'hi' ? '✓ हाँ, पैसा मिल गया' : currentLang === 'ta' ? '✓ ஆம், பணம் கிடைத்தது' : currentLang === 'te' ? '✓ అవును, నగదు అందింది' : currentLang === 'kn' ? '✓ ಹೌದು, ಹಣ ಜಮೆಯಾಗಿದೆ' : currentLang === 'ml' ? '✓ അതെ, പണം ലഭിച്ചു' : '✓ Yes, Money Received';
      const noBtn = currentLang === 'hi' ? '✕ नहीं, पैसा नहीं मिला (प्रथम अपील जनरेट करें)' : currentLang === 'ta' ? '✕ இல்லை, பணம் வரவில்லை (முதல் மேல்முறையீடு செய்க)' : currentLang === 'te' ? '✕ రాలేదు, డబ్బు జమ కాలేదు (మొదటి అప్పీల్ చేయండి)' : currentLang === 'kn' ? '✕ ಇಲ್ಲ, ಹಣ ಬಂದಿಲ್ಲ (ಮೊದಲ ಮೇಲ್ಮನವಿ ಸೃಷ್ಟಿಸಿ)' : currentLang === 'ml' ? '✕ ഇല്ല, പണം ലഭിച്ചില്ല (ഒന്നാം അപ്പീൽ നൽകുക)' : '✕ No, Still Not Credited (Generate CPGRAMS First Appeal)';
      const wrongBtn = currentLang === 'hi' ? '⚠️ गलत विभाग (अपील जनरेट करें)' : currentLang === 'ta' ? '⚠️ தவறான துறை (மேல்முறையீடு செய்க)' : currentLang === 'te' ? '⚠️ తప్పు శాఖ (అప్పీల్ చేయండి)' : currentLang === 'kn' ? '⚠️ ತಪ್ಪು ಇಲಾಖೆ (ಮೇಲ್ಮನವಿ)' : currentLang === 'ml' ? '⚠️ തെറ്റായ വകുപ്പ് (അപ്പീൽ നൽകുക)' : '⚠️ Wrong Department (Generate Appeal)';

      actionCard.innerHTML = `
        <div class="redressal-banner">
          <div class="redressal-title">
            <span>🛡️</span> <span>${redTitle}</span>
          </div>
          <div class="redressal-subtitle">${redSub}</div>
          <div class="redressal-buttons">
            <button class="btn-redress yes" onclick="confirmCaseResolution(${caseObj.id}, 'yes')">
              ${yesBtn}
            </button>
            <button class="btn-redress no" onclick="confirmCaseResolution(${caseObj.id}, 'no')">
              ${noBtn}
            </button>
            <button class="btn-redress wrong" onclick="confirmCaseResolution(${caseObj.id}, 'wrong_dept')">
              ${wrongBtn}
            </button>
          </div>
        </div>
      `;
    } else if (caseObj.status === 'appealed' || isAppealed) {
      const appTitle = currentLang === 'hi' ? `प्रथम अपील डॉकेट जनरेटेड: #${appealDocket}` : currentLang === 'ta' ? `முதல் மேல்முறையீட்டு ஆவணம் உருவானது: #${appealDocket}` : currentLang === 'te' ? `మొదటి అప్పీల్ డాకెట్ రూపొందించబడింది: #${appealDocket}` : currentLang === 'kn' ? `ಮೊದಲ ಮೇಲ್ಮನವಿ ದಾಖಲೆ ಸೃಷ್ಟಿಯಾಗಿದೆ: #${appealDocket}` : currentLang === 'ml' ? `ഒന്നാം അപ്പീൽ ഡോക്കറ്റ് തയ്യാറായി: #${appealDocket}` : `First Appeal Docket Generated: #${appealDocket}`;
      const appSub = currentLang === 'hi' ? 'आपकी अपील CPGRAMS निवारण कतार में पंजीकृत है। प्रशासनिक निस्तारण को औपचारिक रूप से चुनौती दी गई है।' : currentLang === 'ta' ? 'உங்கள் மேல்முறையீடு CPGRAMS வரிசையில் பதிவு செய்யப்பட்டது. தவறான தீர்வு சவாலுக்கு உட்படுத்தப்பட்டுள்ளது.' : currentLang === 'te' ? 'మీ అప్పీల్ CPGRAMS వ్యవస్థలో నమోదైంది.' : currentLang === 'kn' ? 'ನಿಮ್ಮ ಮೇಲ್ಮನವಿಯನ್ನು CPGRAMS ಕ್ಯೂನಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ.' : currentLang === 'ml' ? 'നിങ്ങളുടെ അപ്പീൽ CPGRAMS ക്യൂവിൽ രജിസ്റ്റർ ചെയ്തു.' : 'Your appeal is registered in the CPGRAMS escalation queue. Administrative disposal has been formally challenged.';
      const copyAppBtn = currentLang === 'hi' ? '📋 अपील पत्र कॉपी करें' : currentLang === 'ta' ? '📋 மேல்முறையீட்டு மனுவை நகலெடு' : currentLang === 'te' ? '📋 అప్పీల్ కాపీ చేయండి' : currentLang === 'kn' ? '📋 ಮೇಲ್ಮನವಿ ನಕಲಿಸಿ' : currentLang === 'ml' ? '📋 അപ്പീൽ പകർപ്പാവകാശം' : '📋 Copy Appeal Petition';

      actionCard.innerHTML = `
        <div style="background:#FFF1F2;border:2px solid #F43F5E;border-radius:var(--radius-lg);padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <div>
            <div style="font-weight:900;color:#9F1239;font-size:1.1rem;">⚖️ ${appTitle}</div>
            <div style="font-size:0.85rem;color:#881337;margin-top:0.2rem;">${appSub}</div>
          </div>
          <button class="btn-secondary" onclick="copyAppealText()" style="background:#FFE4E6;color:#9F1239;border-color:#FDA4AF;font-weight:800;">
            ${copyAppBtn}
          </button>
        </div>
      `;
    }
  }

  // Appeal Studio Display
  const appealContainer = document.getElementById('appealDraftContainer');
  if (appealContainer) {
    if (caseObj.appealDraft) {
      appealContainer.style.display = 'block';
      const docTitle = currentLang === 'hi' ? `आधिकारिक CPGRAMS प्रथम अपील दस्तावेज (#${appealDocket})` : currentLang === 'ta' ? `அதிகாரப்பூர்வ CPGRAMS முதல் மேல்முறையீட்டு ஆவணம் (#${appealDocket})` : currentLang === 'te' ? `అధికారిక CPGRAMS మొదటి అప్పీల్ పత్రం (#${appealDocket})` : currentLang === 'kn' ? `ಅಧಿಕೃತ CPGRAMS ಮೊದಲ ಮೇಲ್ಮನವಿ ದಾಖಲೆ (#${appealDocket})` : currentLang === 'ml' ? `ഔദ്യോഗിക CPGRAMS ഒന്നാം അപ്പീൽ രേഖ (#${appealDocket})` : `Official CPGRAMS First Appeal Document (#${appealDocket})`;
      const copyBtn = currentLang === 'hi' ? '📋 अपील कॉपी करें' : currentLang === 'ta' ? '📋 நகலெடு' : currentLang === 'te' ? '📋 కాపీ చేయండి' : currentLang === 'kn' ? '📋 ನಕಲಿಸಿ' : currentLang === 'ml' ? '📋 പകർപ്പാവകാശം' : '📋 Copy Appeal';
      const auditNote = currentLang === 'hi' ? 'अपरिवर्तनीय डिजिटल ऑडिट तथ्यों व विभागीय विफलता के आधार पर तैयार किया गया:' : currentLang === 'ta' ? 'தணிக்கை காலவரிசை மற்றும் துறை செயலற்ற தன்மை உண்மைகளிலிருந்து தொகுக்கப்பட்டது:' : currentLang === 'te' ? 'ఆడిట్ ఆధారాలు మరియు శాఖ నిష్ಕ్రియాత్మకత వాస్తవాలతో రూపొందించబడింది:' : currentLang === 'kn' ? 'ಆಡಿಟ್ ವಿವರಗಳು ಮತ್ತು ಇಲಾಖಾ ವೈಫಲ್ಯದ ಸತ್ಯಗಳೊಂದಿಗೆ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ:' : currentLang === 'ml' ? 'ഡിജിറ്റൽ രേഖകളും വകുപ്പിന്റെ നടപടിയില്ലായ്മയും അടിസ്ഥാനമാക്കി തയ്യാറാക്കിയത്:' : 'Compiled deterministically from persisted timeline events & department inaction facts:';

      appealContainer.innerHTML = `
        <div class="appeal-card" style="margin-top:1.5rem;">
          <div class="appeal-header">
            <div class="appeal-title">
              <span>⚖️</span> <span>${docTitle}</span>
            </div>
            <button class="btn-secondary" onclick="copyAppealText()">${copyBtn}</button>
          </div>
          <div style="font-size:0.85rem;color:#881337;margin-bottom:0.75rem;">
            ${auditNote}
          </div>
          <pre id="appealTextContent" class="petition-preview">${caseObj.appealDraft}</pre>
        </div>
      `;
    } else {
      appealContainer.style.display = 'none';
    }
  }
}

async function advanceCaseStatus(caseId) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/advance-status`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      currentTrackingCase = updated;
      showToast(`Advanced status to: ${updated.status.toUpperCase()}`);
      renderTrackingView(updated);
      await loadCases();
      await loadMetrics();
    } else {
      showToast("Cannot advance status further.");
    }
  } catch (err) {
    showToast("Error advancing case status");
  }
}

async function confirmCaseResolution(caseId, outcome) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/confirm-resolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenConfirmed: outcome })
    });
    if (res.ok) {
      const result = await res.json();
      currentTrackingCase = result.case;
      if (outcome === 'yes') {
        showToast("🎉 Resolution verified! Entitled funds/service received. Case officially closed.");
      } else if (result.appealGenerated) {
        showToast("⚖️ CPGRAMS First Appeal Created & Logged!");
      } else {
        showToast("Resolution confirmed!");
      }
      renderTrackingView(result.case);
      // Show "What Happens Next" card for appealed cases
      const nextCard = document.getElementById('whatHappensNext');
      if (nextCard) nextCard.style.display = result.appealGenerated ? 'block' : 'none';
      await loadCases();
      await loadMetrics();
    }
  } catch (err) {
    showToast("Error recording resolution confirmation");
  }
}  const matchedTxt = currentLang === 'hi' ? 'सक्रिय नियम ट्रिगर' : currentLang === 'ta' ? 'செயலில் உள்ள விதி தூண்டுதல்' : currentLang === 'te' ? 'నియమ సరిపోలిక' : currentLang === 'kn' ? 'ಹೊಂದಿಕೆಯಾದ ನಿಯಮ' : currentLang === 'ml' ? 'പൊരുത്തപ്പെട്ട നിയമം' : 'Matched Rule Trigger';

  container.innerHTML = `
    <div class="routing-banner">
      <div class="routing-header">${headerTxt}</div>
      <div class="routing-dept">${routing.department}</div>
      <div class="routing-reason">
        <strong>${matchedTxt}:</strong> ${routing.reason}
      </div>
      <div style="display:flex;gap:1rem;margin-top:1rem;font-size:0.82rem;color:#CCFBF1;flex-wrap:wrap;">
        <div>✓ Category: <strong>${selectedCategory}</strong></div>
        <div>✓ Confidence: <strong>100% Deterministic Rule</strong></div>
        <div>✓ Portal: <strong>CPGRAMS Integrated</strong></div>
      </div>
    </div>
  `;
}

// Step 5: Evidence Readiness
function renderEvidenceCheck() {
  const dict = i18n[currentLang] || i18n.en;
  let total = 4;
  let present = Object.values(evidenceState).filter(Boolean).length;
  let percent = Math.round((present / total) * 100);

  const meterFill = document.getElementById('evidenceMeterFill');
  const meterText = document.getElementById('evidenceMeterPercent');
  if (meterFill) meterFill.style.width = `${percent}%`;
  if (meterText) meterText.textContent = `${percent}%`;

  const list = document.getElementById('evidenceChecklist');
  if (list) {
    const doc1 = currentLang === 'hi' ? 'आधार पहचान सत्यापन दस्तावेज (अनिवार्य)' : currentLang === 'ta' ? 'ஆதார் அடையாள ஆவணம் (கட்டாயம்)' : currentLang === 'te' ? 'ఆధార్ గుర్తింపు పత్రం (తప్పనిసరి)' : currentLang === 'kn' ? 'ಆಧಾರ್ ಗುರುತಿನ ದಾಖಲೆ (ಕಡ್ಡಾಯ)' : currentLang === 'ml' ? 'ആധാർ തിരിച്ചറിയൽ രേഖ (നിർബന്ധം)' : 'Aadhaar Identity Verification Document (Mandatory)';
    const doc2 = currentLang === 'hi' ? 'योजना पंजीकरण / लाभार्थी संदर्भ पर्ची (अनिवार्य)' : currentLang === 'ta' ? 'திட்ட பதிவு / பயனாளி குறிப்பு அட்டை (கட்டாயம்)' : currentLang === 'te' ? 'పథకం రిజిస్ట్రేషన్ రసీదు (తప్పనిసరి)' : currentLang === 'kn' ? 'ಯೋಜನೆ ನೋಂದಣಿ ರಶೀದಿ (ಕಡ್ಡಾಯ)' : currentLang === 'ml' ? 'പദ്ധതി രജിസ്ട്രേഷൻ രസീത് (നിർബന്ധം)' : 'Scheme Registration / Beneficiary Reference (Mandatory)';
    const doc3 = currentLang === 'hi' ? 'बैंक पासबुक / NPCI आधार सीडिंग विवरण (अनुशंसित)' : currentLang === 'ta' ? 'வங்கி பாஸ்புக் / NPCI ஆதார் இணைப்பு அறிக்கை (பரிந்துரைக்கப்படுகிறது)' : currentLang === 'te' ? 'బ్యాంక్ పాస్‌బుక్ / NPCI సీడింగ్ స్టేట్‌మెంట్ (సిఫార్సు చేయబడింది)' : currentLang === 'kn' ? 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ / NPCI ಸೀಡಿಂಗ್ ವಿವರ (ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ)' : currentLang === 'ml' ? 'ബാങ്ക് പാസ്ബുക്ക് / NPCI ആധാർ സീഡിംഗ് സ്റ്റേറ്റ്‌മെന്റ് (ശുപാർശ ചെയ്യുന്നത്)' : 'Bank Passbook / NPCI Seeding Statement (Recommended)';
    const doc4 = currentLang === 'hi' ? 'पोर्टल स्थिति स्क्रीनशॉट / अस्वीकृति पर्ची (अनुशंसित)' : currentLang === 'ta' ? 'போர்ட்டல் நிலை ஸ்கிரீன்ஷாட் / நிராகரிப்பு சீட்டு (பரிந்துரைக்கப்படுகிறது)' : currentLang === 'te' ? 'పోర్టల్ స్టేటస్ స్క్రీన్‌షాట్ / తిరస్కరణ పత్రం (సిఫార్సు చేయబడింది)' : currentLang === 'kn' ? 'ಪೋರ್ಟಲ್ ಸ್ಥಿತಿ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ / ತಿರಸ್ಕಾರ ಚೀಟಿ (ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ)' : currentLang === 'ml' ? 'പോർട്ടൽ സ്റ്റാറ്റസ് സ്ക്രീൻഷോട്ട് / നിരസിക്കൽ സ്ലിപ്പ് (ശുപാർശ ചെയ്യുന്നത്)' : 'Government Portal Status Screenshot / Rejection Slip (Recommended)';

    list.innerHTML = `
      <label class="checklist-item">
        <input type="checkbox" ${evidenceState.aadhaar ? 'checked' : ''} onchange="toggleEvidence('aadhaar')">
        <div class="checklist-label">
          <strong>${doc1}</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);display:block;">${currentLang === 'hi' ? 'नाम और जन्म तिथि का मिलान' : currentLang === 'ta' ? 'பெயர் மற்றும் பிறந்த தேதி பொருத்தம்' : currentLang === 'te' ? 'పేరు మరియు పుట్టిన తేదీ ధృవీకరణ' : currentLang === 'kn' ? 'ಹೆಸರು ಮತ್ತು ಜನ್ಮ ದಿನಾಂಕ ಪರಿಶೀಲನೆ' : currentLang === 'ml' ? 'പേരും ജനനത്തീയതിയും സ്ഥിരീകരിക്കൽ' : 'Demographic matching with database'}</span>
        </div>
      </label>

      <label class="checklist-item">
        <input type="checkbox" ${evidenceState.registrationProof ? 'checked' : ''} onchange="toggleEvidence('registrationProof')">
        <div class="checklist-label">
          <strong>${doc2}</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);display:block;">${currentLang === 'hi' ? 'आवेदन संदर्भ या UAN/PAN' : currentLang === 'ta' ? 'விண்ணப்ப குறிப்பு அல்லது UAN/PAN' : currentLang === 'te' ? 'దరఖాస్తు రిఫరెన్స్ లేదా UAN/PAN' : currentLang === 'kn' ? 'ಅರ್ಜಿ ಸಂಖ್ಯೆ ಅಥವಾ UAN/PAN' : currentLang === 'ml' ? 'അപേക്ഷാ റഫറൻസ് അല്ലെങ്കിൽ UAN/PAN' : 'Scheme application reference or ID'}</span>
        </div>
      </label>

      <label class="checklist-item">
        <input type="checkbox" ${evidenceState.bankProof ? 'checked' : ''} onchange="toggleEvidence('bankProof')">
        <div class="checklist-label">
          <strong>${doc3}</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);display:block;">${currentLang === 'hi' ? 'DBT भुगतान पुष्टि हेतु' : currentLang === 'ta' ? 'DBT வங்கி கணக்கு சரிபார்ப்பு' : currentLang === 'te' ? 'DBT బ్యాంక్ ఖాతా ధృవీకరణ' : currentLang === 'kn' ? 'DBT ಖಾತೆ ಪರಿಶೀಲನೆ' : currentLang === 'ml' ? 'DBT ബാങ്ക് അക്കൗണ്ട് ഉറപ്പുവരുത്താൻ' : 'Verifies active DBT payment route'}</span>
        </div>
      </label>

      <label class="checklist-item">
        <input type="checkbox" ${evidenceState.statusScreenshot ? 'checked' : ''} onchange="toggleEvidence('statusScreenshot')">
        <div class="checklist-label">
          <strong>${doc4}</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);display:block;">${currentLang === 'hi' ? 'विभाग द्वारा दी गई अस्वीकृति या त्रुटि' : currentLang === 'ta' ? 'துறை காட்டிய பிழை அல்லது நிராகரிப்பு' : currentLang === 'te' ? 'శాఖ చూపించిన లోపం లేదా తిరస్కరణ' : currentLang === 'kn' ? 'ಇಲಾಖೆ ತೋರಿಸಿದ ದೋಷ ಅಥವಾ ತಿರಸ್ಕಾರ' : currentLang === 'ml' ? 'വകുപ്പ് കാണിച്ച പിഴവ് അല്ലെങ്കിൽ നിരസിക്കൽ' : 'Departmental rejection reason documentation'}</span>
        </div>
      </label>
    `;
  }
}

function toggleEvidence(key) {
  evidenceState[key] = !evidenceState[key];
  renderEvidenceCheck();
}

// Step 6: Petition Preview
function renderPetitionPreview() {
  const name = document.getElementById('beneficiaryName').value || "Citizen";
  const id = document.getElementById('beneficiaryId').value || "REF-XXXX";
  const state = document.getElementById('stateSelect').value || "India";
  const complaint = document.getElementById('complaintText').value || "";
  const dept = routingResult ? routingResult.department : "Designated Department";

  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const petition = `TO:
The Public Grievance Nodal Officer
${dept}
Government of India

DATE: ${date}
SUBJECT: Formal Citizen Grievance Petition — ${selectedCategory.toUpperCase().replace(/_/g, ' ')}
BENEFICIARY REFERENCE: ${id}
NAME & STATE: ${name}, ${state}

RESPECTED AUTHORITY,

I am submitting this formal grievance petition regarding my pending entitlement under the referenced government scheme.

1. STATEMENT OF GRIEVANCE:
"${complaint}"

2. PREREQUISITE DIAGNOSTIC AUDIT:
${Object.entries(diagnosticAnswers).map(([k, v]) => `   - ${k}: ${v ? 'VERIFIED (PASS)' : 'FLAGGED'}`).join('\n')}

3. ATTACHED EVIDENCE:
${Object.entries(evidenceState).filter(([_, v]) => v).map(([k]) => `   - ${k.toUpperCase()}`).join('\n')}

4. RELIEF REQUESTED:
I request the competent authority to examine this matter, expedite the departmental processing, and release the pending entitlement/disbursal.

YOURS FAITHFULLY,
${name}
(Filing via NyayaFlow Civic Redressal Assistant)`;

  const box = document.getElementById('petitionPreviewText');
  if (box) box.textContent = petition;
}

// Step 6: Submit to SQLite Backend
async function submitCase() {
  const submitBtn = document.getElementById('submitCaseBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting to NyayaFlow Engine...';
  }

  const payload = {
    category: selectedCategory || 'pm_kisan_payment_failure',
    complaintText: document.getElementById('complaintText').value || "Citizen Grievance",
    diagnosticAnswers: diagnosticAnswers,
    routedDepartment: routingResult ? routingResult.department : "Ministry of Agriculture and Farmers Welfare (PM-KISAN Cell)",
    routingReason: routingResult ? routingResult.reason : "Matched standard payment routing rule.",
    evidence: [
      { type: "aadhaar", description: "Aadhaar Identity Document", present: evidenceState.aadhaar },
      { type: "beneficiaryId", description: "Scheme Registration Reference", present: evidenceState.registrationProof },
      { type: "bankProof", description: "Bank Account & NPCI Seeding Statement", present: evidenceState.bankProof },
      { type: "statusScreenshot", description: "Portal Status Screenshot", present: evidenceState.statusScreenshot }
    ]
  };

  try {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      createdCase = await res.json();
      currentTrackingCase = createdCase;
      showToast(`Case #${createdCase.id} created and tracked!`);
      renderTrackingView(createdCase);
      goToStep(7);
    } else {
      showToast("Error saving case to backend");
    }
  } catch (err) {
    showToast("Network error submitting case");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Formal Grievance ➔';
    }
  }
}

// Step 7: Case Lifecycle Tracker & Timeline
function renderTrackingView(caseObj) {
  if (!caseObj) return;

  const dict = i18n[currentLang] || i18n.en;
  const isAppealed = caseObj.status === 'appealed' || caseObj.appealDraft;
  const appealDocket = `CPGRAMS-APP-${new Date().getFullYear()}-${caseObj.id.toString().padStart(4, '0')}`;

  const header = document.getElementById('trackingHeader');
  if (header) {
    const caseRefTxt = currentLang === 'hi' ? 'केस संदर्भ' : currentLang === 'ta' ? 'வழக்கு குறிப்பு' : currentLang === 'te' ? 'కేసు రిఫరెన్స్' : currentLang === 'kn' ? 'ಪ್ರಕರಣ ಉಲ್ಲೇಖ' : currentLang === 'ml' ? 'കേസ് റഫറൻസ്' : 'CASE REF';
    const appealDocketTxt = currentLang === 'hi' ? 'प्रथम अपील डॉकेट' : currentLang === 'ta' ? 'முதல் மேல்முறையீட்டு ஆவணம்' : currentLang === 'te' ? 'మొదటి అప్పీల్ డాకెట్' : currentLang === 'kn' ? 'ಮೊದಲ ಮೇಲ್ಮನವಿ ದಾಖಲೆ' : currentLang === 'ml' ? 'ഒന്നാം അപ്പീൽ ഡോക്കറ്റ്' : 'Appeal Docket';

    header.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;width:100%;">
        <div>
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span style="font-size:0.75rem;font-weight:800;color:var(--primary);text-transform:uppercase;">${caseRefTxt} #${caseObj.id}</span>
            ${isAppealed ? `<span style="background:#FFE4E6;color:#E11D48;font-size:0.75rem;font-weight:800;padding:2px 8px;border-radius:999px;border:1px solid #FDA4AF;">⚖️ ${appealDocketTxt} #${appealDocket}</span>` : ''}
          </div>
          <h2 style="font-size:1.35rem;font-weight:900;margin-top:0.2rem;">${caseObj.category.replace(/_/g, ' ').toUpperCase()}</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);">${caseObj.routedDepartment}</p>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span class="status-badge ${caseObj.status.toLowerCase()}">${caseObj.status.replace(/_/g, ' ')}</span>
        </div>
      </div>
    `;
  }

  // Plain Language Status Box
  const statusBox = document.getElementById('plainStatusBox');
  if (statusBox) {
    const plainHeader = currentLang === 'hi' ? 'नागरिक सरल भाषा स्थिति' : currentLang === 'ta' ? 'குடிமக்கள் எளிய மொழி நிலை' : currentLang === 'te' ? 'పౌరుల సులభ భాష స్థితి' : currentLang === 'kn' ? 'ನಾಗರಿಕರ ಸರಳ ಭಾಷಾ ಸ್ಥಿತಿ' : currentLang === 'ml' ? 'പൗരന്മാർക്കുള്ള ലളിത വിവരണം' : 'Citizen Plain-Language Status';

    statusBox.innerHTML = `
      <div style="background:var(--primary-light);border:1.5px solid var(--primary);border-radius:var(--radius-md);padding:1rem 1.25rem;">
        <div style="font-size:0.75rem;font-weight:800;color:var(--primary-dark);text-transform:uppercase;">${plainHeader}</div>
        <div style="font-size:1.05rem;font-weight:800;color:var(--primary-dark);margin-top:0.25rem;">
          "${caseObj.statusPlainLanguage}"
        </div>
      </div>
    `;
  }

  // ── SLA Breach Timer ──
  const slaContainer = document.getElementById('slaTimerContainer');
  if (slaContainer) {
    const slaInfo = getSlaInfo(caseObj);
    if (slaInfo) {
      const barColor = slaInfo.breached ? 'var(--danger)' : slaInfo.remainingDays < 3 ? 'var(--warning)' : 'var(--success)';
      const pct = Math.min(100, (slaInfo.elapsedDays / slaInfo.sla) * 100);
      slaContainer.innerHTML = `
        <div style="background:${slaInfo.breached ? 'var(--danger-bg)' : '#F0FDFA'};border:1.5px solid ${slaInfo.breached ? 'var(--danger)' : 'var(--primary)'};border-radius:var(--radius-md);padding:0.85rem 1.25rem;margin-bottom:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
            <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:${slaInfo.breached ? 'var(--danger)' : 'var(--primary-dark)'};">
              ${slaInfo.breached ? '🚨 SLA BREACHED' : '⏱️ SLA Compliance Timer'}
            </div>
            <div style="font-size:0.85rem;font-weight:900;color:${slaInfo.breached ? 'var(--danger)' : 'var(--primary)'};">
              ${slaInfo.breached ? `Overdue by ${slaInfo.elapsedDays - slaInfo.sla} days` : `${slaInfo.remainingDays} days remaining`}
            </div>
          </div>
          <div style="background:#E2DDD5;border-radius:999px;height:8px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:999px;transition:width 0.6s ease;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:0.3rem;font-size:0.7rem;color:var(--text-muted);">
            <span>${slaInfo.elapsedDays} days elapsed</span>
            <span>SLA: ${slaInfo.sla} days for ${caseObj.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
      `;
    } else {
      slaContainer.innerHTML = '';
    }
  }

  // ── Audit Hash Display ──
  const auditHashContainer = document.getElementById('auditHashContainer');
  if (auditHashContainer && caseObj.auditHash && caseObj.auditHash !== '0'.repeat(64)) {
    auditHashContainer.innerHTML = `
      <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.65rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.75rem;">
        <span style="font-size:1.1rem;">🔒</span>
        <div>
          <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);">SHA-256 Hash Chain (Tamper-Evident Audit)</div>
          <div style="font-family:monospace;font-size:0.72rem;color:var(--primary-dark);word-break:break-all;margin-top:0.15rem;">${escapeHtml(caseObj.auditHash)}</div>
        </div>
      </div>
    `;
  } else if (auditHashContainer) {
    auditHashContainer.innerHTML = '';
  }

  // Timeline
  const timelineContainer = document.getElementById('caseTimelineContainer');
  if (timelineContainer && caseObj.timeline) {
    timelineContainer.innerHTML = caseObj.timeline.map((event, idx) => `
      <div class="timeline-item">
        <div class="timeline-dot ${event.stage.toLowerCase()}"></div>
        <div class="timeline-content">
          <div class="timeline-stage">${escapeHtml(event.stage.replace(/_/g, ' '))}</div>
          <div class="timeline-time">${new Date(event.timestamp).toLocaleString('en-IN')}</div>
          <div class="timeline-note">${escapeHtml(event.note)}</div>
        </div>
      </div>
    `).join('');
  }

  // PROMINENT BOTTOM ACTION CARD (Advance status OR Citizen resolution prompt)
  const actionCard = document.getElementById('advanceActionCard');
  if (actionCard) {
    const nextTransitions = {
      submitted: "ROUTED",
      routed: "UNDER PROCESS",
      under_process: "DISPOSED"
    };
    const nextStage = nextTransitions[caseObj.status];

    if (nextStage) {
      const demoActionTxt = currentLang === 'hi' ? '⚡ मुख्य इंटरैक्टिव डेमो एक्शन' : currentLang === 'ta' ? '⚡ முதன்மை ஊடாடும் செயல்முறை' : currentLang === 'te' ? '⚡ ప్రధాన ఇంటరాక్టివ్ డెమో చర్య' : currentLang === 'kn' ? '⚡ ಪ್ರಮುಖ ಸಂವಾದಾತ್ಮಕ ಡೆಮೊ ಕ್ರಿಯೆ' : currentLang === 'ml' ? '⚡ പ്രധാന ഇന്ററാക്ടീവ് ഡെമോ' : '⚡ Primary Interactive Demo Action';
      const simTxt = currentLang === 'hi' ? 'विभागीय प्रगति का अनुकरण करें' : currentLang === 'ta' ? 'துறை முன்னேற்றத்தை உருவகப்படுத்துங்கள்' : currentLang === 'te' ? 'శాఖ పురోగతిని అనుకరించండి' : currentLang === 'kn' ? 'ಇಲಾಖಾ ಪ್ರಗತಿಯನ್ನು ಅನುಕರಿಸಿ' : currentLang === 'ml' ? 'വകുപ്പുതല നടപടി മുന്നോട്ട് കൊണ്ടുപോകുക' : 'Simulate Department Progression';
      const advanceBtnTxt = currentLang === 'hi' ? `⏩ विभागीय स्थिति आगे बढ़ाएं (➔ ${nextStage})` : currentLang === 'ta' ? `⏩ துறை நிலையை முன்னேற்றுங்கள் (➔ ${nextStage})` : currentLang === 'te' ? `⏩ శాఖ స్థితిని ముందుకు తీసుకెళ్లండి (➔ ${nextStage})` : currentLang === 'kn' ? `⏩ ಇಲಾಖಾ ಸ್ಥಿತಿಯನ್ನು ಮುನ್ನಡೆಸಿ (➔ ${nextStage})` : currentLang === 'ml' ? `⏩ വകുപ്പ് നടപടി അടുത്ത ഘട്ടത്തിലേക്ക് (➔ ${nextStage})` : `⏩ Advance Department Status (➔ ${nextStage})`;

      actionCard.innerHTML = `
        <div style="background:linear-gradient(135deg, #0F766E 0%, #134E4A 100%);color:#fff;border-radius:var(--radius-lg);padding:1.5rem 1.75rem;box-shadow:var(--shadow-md);">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.25rem;">
            <div>
              <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#99F6E4;">${demoActionTxt}</div>
              <div style="font-size:1.2rem;font-weight:900;margin-top:0.25rem;">${simTxt}</div>
              <p style="font-size:0.85rem;color:#CCFBF1;margin-top:0.15rem;">Next: <strong>${nextStage}</strong></p>
            </div>
            <button id="mainAdvanceBtn" class="btn-sandbox" style="font-size:1rem;padding:0.85rem 1.75rem;background:#E8793B;box-shadow:0 4px 14px rgba(0,0,0,0.25);" onclick="advanceCaseStatus(${caseObj.id})">
              ${advanceBtnTxt}
            </button>
          </div>
        </div>
      `;
    } else if (caseObj.status === 'disposed') {
      const redTitle = currentLang === 'hi' ? 'नागरिक समाधान सत्यापन (न्यायफ्लो कोर निवारण)' : currentLang === 'ta' ? 'குடிமக்கள் தீர்வு உறுதிப்படுத்தல் (முக்கிய குறைதீர்ப்பு)' : currentLang === 'te' ? 'పౌర పరిష్కార ధృవీకరణ (ప్రధాన న్యాయ వేదిక)' : currentLang === 'kn' ? 'ನಾಗರಿಕ ಪರಿಹಾರ ದೃಢೀಕರಣ' : currentLang === 'ml' ? 'പൗര പരിഹാര സ്ഥിരീകരണം' : 'Citizen Resolution Verification (Core NyayaFlow Redressal)';
      const redSub = currentLang === 'hi' ? 'विभाग ने इस शिकायत को "निस्तारित" (Disposed) चिह्नित किया है। क्या आपको वास्तव में बैंक खाते में पैसा/सेवा प्राप्त हुई?' : currentLang === 'ta' ? 'துறை இந்த புகாரை "முடிக்கப்பட்டது" என குறித்தது. உங்கள் வங்கி கணக்கில் உண்மையில் பணம் கிடைத்ததா?' : currentLang === 'te' ? 'శాఖ ఈ ఫిర్యాదును "పరిష్కరించబడింది"గా గుర్తించింది. మీ బ్యాంక్ ఖాతాలో నిజంగా నగదు జమయిందా?' : currentLang === 'kn' ? 'ಇಲಾಖೆಯು ದೂರನ್ನು "ವಿಲೇವಾರಿ" ಎಂದು ಗುರುತಿಸಿದೆ. ನಿಮ್ಮ ಖಾತೆಗೆ ಹಣ ಜಮೆಯಾಗಿದೆಯೇ?' : currentLang === 'ml' ? 'വകുപ്പ് പരാതി തീർപ്പാക്കിയതായി രേഖപ്പെടുത്തി. നിങ്ങളുടെ ബാങ്ക് അക്കൗണ്ടിൽ പണം ലഭിച്ചോ?' : 'The department marked this complaint as "Disposed". Did you actually receive your entitled money or service in your bank account?';
      const yesBtn = currentLang === 'hi' ? '✓ हाँ, पैसा मिल गया' : currentLang === 'ta' ? '✓ ஆம், பணம் கிடைத்தது' : currentLang === 'te' ? '✓ అవును, నగదు అందింది' : currentLang === 'kn' ? '✓ ಹೌದು, ಹಣ ಜಮೆಯಾಗಿದೆ' : currentLang === 'ml' ? '✓ അതെ, പണം ലഭിച്ചു' : '✓ Yes, Money Received';
      const noBtn = currentLang === 'hi' ? '✕ नहीं, पैसा नहीं मिला (प्रथम अपील जनरेट करें)' : currentLang === 'ta' ? '✕ இல்லை, பணம் வரவில்லை (முதல் மேல்முறையீடு செய்க)' : currentLang === 'te' ? '✕ రాలేదు, డబ్బు జమ కాలేదు (మొదటి అప్పీల్ చేయండి)' : currentLang === 'kn' ? '✕ ಇಲ್ಲ, ಹಣ ಬಂದಿಲ್ಲ (ಮೊದಲ ಮೇಲ್ಮನವಿ ಸೃಷ್ಟಿಸಿ)' : currentLang === 'ml' ? '✕ ഇല്ല, പണം ലഭിച്ചില്ല (ഒന്നാം അപ്പീൽ നൽകുക)' : '✕ No, Still Not Credited (Generate CPGRAMS First Appeal)';
      const wrongBtn = currentLang === 'hi' ? '⚠️ गलत विभाग (अपील जनरेट करें)' : currentLang === 'ta' ? '⚠️ தவறான துறை (மேல்முறையீடு செய்க)' : currentLang === 'te' ? '⚠️ తప్పు శాఖ (అప్పీల్ చేయండి)' : currentLang === 'kn' ? '⚠️ ತಪ್ಪು ಇಲಾಖೆ (ಮೇಲ್ಮನವಿ)' : currentLang === 'ml' ? '⚠️ തെറ്റായ വകുപ്പ് (അപ്പീൽ നൽകുക)' : '⚠️ Wrong Department (Generate Appeal)';

      actionCard.innerHTML = `
        <div class="redressal-banner">
          <div class="redressal-title">
            <span>🛡️</span> <span>${redTitle}</span>
          </div>
          <div class="redressal-subtitle">${redSub}</div>
          <div class="redressal-buttons">
            <button class="btn-redress yes" onclick="confirmCaseResolution(${caseObj.id}, 'yes')">
              ${yesBtn}
            </button>
            <button class="btn-redress no" onclick="confirmCaseResolution(${caseObj.id}, 'no')">
              ${noBtn}
            </button>
            <button class="btn-redress wrong" onclick="confirmCaseResolution(${caseObj.id}, 'wrong_dept')">
              ${wrongBtn}
            </button>
          </div>
        </div>
      `;
    } else if (caseObj.status === 'appealed' || isAppealed) {
      const appTitle = currentLang === 'hi' ? `प्रथम अपील डॉकेट जनरेटेड: #${appealDocket}` : currentLang === 'ta' ? `முதல் மேல்முறையீட்டு ஆவணம் உருவானது: #${appealDocket}` : currentLang === 'te' ? `మొదటి అప్పీల్ డాకెట్ రూపొందించబడింది: #${appealDocket}` : currentLang === 'kn' ? `ಮೊದಲ ಮೇಲ್ಮನವಿ ದಾಖಲೆ ಸೃಷ್ಟಿಯಾಗಿದೆ: #${appealDocket}` : currentLang === 'ml' ? `ഒന്നാം അപ്പീൽ ഡോക്കറ്റ് തയ്യാറായി: #${appealDocket}` : `First Appeal Docket Generated: #${appealDocket}`;
      const appSub = currentLang === 'hi' ? 'आपकी अपील CPGRAMS निवारण कतार में पंजीकृत है। प्रशासनिक निस्तारण को औपचारिक रूप से चुनौती दी गई है।' : currentLang === 'ta' ? 'உங்கள் மேல்முறையீடு CPGRAMS வரிசையில் பதிவு செய்யப்பட்டது. தவறான தீர்வு சவாலுக்கு உட்படுத்தப்பட்டுள்ளது.' : currentLang === 'te' ? 'మీ అప్పీల్ CPGRAMS వ్యవస్థలో నమోదైంది.' : currentLang === 'kn' ? 'ನಿಮ್ಮ ಮೇಲ್ಮನವಿಯನ್ನು CPGRAMS ಕ್ಯೂನಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ.' : currentLang === 'ml' ? 'നിങ്ങളുടെ അപ്പീൽ CPGRAMS ക്യൂവിൽ രജിസ്റ്റർ ചെയ്തു.' : 'Your appeal is registered in the CPGRAMS escalation queue. Administrative disposal has been formally challenged.';
      const copyAppBtn = currentLang === 'hi' ? '📋 अपील पत्र कॉपी करें' : currentLang === 'ta' ? '📋 மேல்முறையீட்டு மனுவை நகலெடு' : currentLang === 'te' ? '📋 అప్పీల్ కాపీ చేయండి' : currentLang === 'kn' ? '📋 ಮೇಲ್ಮನವಿ ನಕಲಿಸಿ' : currentLang === 'ml' ? '📋 അപ്പീൽ പകർപ്പാവകാശം' : '📋 Copy Appeal Petition';

      actionCard.innerHTML = `
        <div style="background:#FFF1F2;border:2px solid #F43F5E;border-radius:var(--radius-lg);padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <div>
            <div style="font-weight:900;color:#9F1239;font-size:1.1rem;">⚖️ ${appTitle}</div>
            <div style="font-size:0.85rem;color:#881337;margin-top:0.2rem;">${appSub}</div>
          </div>
          <button class="btn-secondary" onclick="copyAppealText()" style="background:#FFE4E6;color:#9F1239;border-color:#FDA4AF;font-weight:800;">
            ${copyAppBtn}
          </button>
        </div>
      `;
    }
  }

  // Appeal Studio Display
  const appealContainer = document.getElementById('appealDraftContainer');
  if (appealContainer) {
    if (caseObj.appealDraft) {
      appealContainer.style.display = 'block';
      const docTitle = currentLang === 'hi' ? `आधिकारिक CPGRAMS प्रथम अपील दस्तावेज (#${appealDocket})` : currentLang === 'ta' ? `அதிகாரப்பூர்வ CPGRAMS முதல் மேல்முறையீட்டு ஆவணம் (#${appealDocket})` : currentLang === 'te' ? `అధికారిక CPGRAMS మొదటి అప్పీల్ పత్రం (#${appealDocket})` : currentLang === 'kn' ? `ಅಧಿಕೃತ CPGRAMS ಮೊದಲ ಮೇಲ್ಮನವಿ ದಾಖಲೆ (#${appealDocket})` : currentLang === 'ml' ? `ഔദ്യോഗിക CPGRAMS ഒന്നാം അപ്പീൽ രേഖ (#${appealDocket})` : `Official CPGRAMS First Appeal Document (#${appealDocket})`;
      const copyBtn = currentLang === 'hi' ? '📋 अपील कॉपी करें' : currentLang === 'ta' ? '📋 நகலெடு' : currentLang === 'te' ? '📋 కాపీ చేయండి' : currentLang === 'kn' ? '📋 ನಕಲಿಸಿ' : currentLang === 'ml' ? '📋 പകർപ്പാവകാശം' : '📋 Copy Appeal';
      const auditNote = currentLang === 'hi' ? 'अपरिवर्तनीय डिजिटल ऑडिट तथ्यों व विभागीय विफलता के आधार पर तैयार किया गया:' : currentLang === 'ta' ? 'தணிக்கை காலவரிசை மற்றும் துறை செயலற்ற தன்மை உண்மைகளிலிருந்து தொகுக்கப்பட்டது:' : currentLang === 'te' ? 'ఆడిట్ ఆధారాలు మరియు శాఖ నిష్క్రియాత్మకత వాస్తవాలతో రూపొందించబడింది:' : currentLang === 'kn' ? 'ಆಡಿಟ್ ವಿವರಗಳು ಮತ್ತು ಇಲಾಖಾ ವೈಫಲ್ಯದ ಸತ್ಯಗಳೊಂದಿಗೆ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ:' : currentLang === 'ml' ? 'ഡിജിറ്റൽ രേഖകളും വകുപ്പിന്റെ നടപടിയില്ലായ്മയും അടിസ്ഥാനമാക്കി തയ്യാറാക്കിയത്:' : 'Compiled deterministically from persisted timeline events & department inaction facts:';

      appealContainer.innerHTML = `
        <div class="appeal-card" style="margin-top:1.5rem;">
          <div class="appeal-header">
            <div class="appeal-title">
              <span>⚖️</span> <span>${docTitle}</span>
            </div>
            <button class="btn-secondary" onclick="copyAppealText()">${copyBtn}</button>
          </div>
          <div style="font-size:0.85rem;color:#881337;margin-bottom:0.75rem;">
            ${auditNote}
          </div>
          <pre id="appealTextContent" class="petition-preview">${caseObj.appealDraft}</pre>
        </div>
      `;
    } else {
      appealContainer.style.display = 'none';
    }
  }
}

async function advanceCaseStatus(caseId) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/advance-status`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      currentTrackingCase = updated;
      showToast(`Advanced status to: ${updated.status.toUpperCase()}`);
      renderTrackingView(updated);
      await loadCases();
      await loadMetrics();
    } else {
      showToast("Cannot advance status further.");
    }
  } catch (err) {
    showToast("Error advancing case status");
  }
}

async function confirmCaseResolution(caseId, outcome) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/confirm-resolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenConfirmed: outcome })
    });
    if (res.ok) {
      const result = await res.json();
      currentTrackingCase = result.case;
      showToast(result.appealGenerated ? "⚖️ CPGRAMS First Appeal Created & Logged!" : "Resolution confirmed!");
      renderTrackingView(result.case);
      // Show "What Happens Next" card for appealed cases
      const nextCard = document.getElementById('whatHappensNext');
      if (nextCard) nextCard.style.display = result.appealGenerated ? 'block' : 'none';
      await loadCases();
      await loadMetrics();
    }
  } catch (err) {
    showToast("Error recording resolution confirmation");
  }
}

function copyAppealText() {
  const el = document.getElementById('appealTextContent');
  if (el) {
    navigator.clipboard.writeText(el.textContent);
    showToast("Appeal draft copied to clipboard!");
  }
}

function copyPetitionText() {
  const el = document.getElementById('petitionPreviewText');
  if (el) {
    navigator.clipboard.writeText(el.textContent);
    showToast("Petition copied to clipboard!");
  }
}

// Citizen Case Lookup by Reference ID
async function lookupCitizenCase() {
  const input = document.getElementById('lookupCaseId');
  const caseId = input ? input.value.trim() : '';
  if (!caseId) {
    showToast("Please enter your Case Reference ID (e.g. 1, 2, 3...)");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (res.ok) {
      const caseObj = await res.json();
      currentTrackingCase = caseObj;
      showToast(`Loaded Case #${caseObj.id}`);
      renderTrackingView(caseObj);
      goToStep(7);
    } else {
      showToast(`❌ Case #${caseId} not found in official registry.`);
    }
  } catch (err) {
    showToast("Error retrieving case record.");
  }
}

// ── Department Nodal Officer Directory & Authentication State ──
const OFFICER_DIRECTORY = {
  pm_kisan: {
    email: "officer.pmkisan@gov.in",
    name: "Dr. R. K. Singh",
    officerId: "GOI-AGRI-8821",
    department: "Ministry of Agriculture and Farmers Welfare (PM-KISAN Cell)",
    filterKey: "PM-KISAN"
  },
  epfo: {
    email: "officer.epfo@gov.in",
    name: "Smt. V. Lakshmi",
    officerId: "EPFO-HQ-4419",
    department: "EPFO Regional PF Commissioner Office",
    filterKey: "EPFO"
  },
  incometax: {
    email: "officer.incometax@gov.in",
    name: "Shri A. K. Verma",
    officerId: "CBDT-CPC-9912",
    department: "CPC-ITR / Income Tax Grievance Cell",
    filterKey: "Income Tax"
  },
  nsp: {
    email: "officer.nsp@gov.in",
    name: "Dr. Sunita Rao",
    officerId: "EDU-NSP-3304",
    department: "National Scholarship Portal Grievance Cell",
    filterKey: "Scholarship"
  }
};

let currentOfficer = null;

function handleOfficerLogin() {
  const emailInput = document.getElementById('officerEmail')?.value?.trim().toLowerCase() || '';
  const passwordInput = document.getElementById('officerPassword')?.value || '';

  if (passwordInput !== 'GovtOfficer@2026') {
    showToast("❌ Invalid SSO Password. Use 'GovtOfficer@2026' or click a 1-Click Demo Login.");
    return;
  }

  const matched = Object.values(OFFICER_DIRECTORY).find(o => o.email.toLowerCase() === emailInput);

  if (matched) {
    currentOfficer = matched;
  } else {
    // Generic officer fallback
    currentOfficer = {
      email: emailInput,
      name: "Officer " + emailInput.split('@')[0],
      officerId: "GOI-NODAL-" + Math.floor(1000 + Math.random() * 9000),
      department: "Central Redressal Nodal Cell",
      filterKey: "all"
    };
  }

  showToast(`🏛️ Logged in as: ${currentOfficer.name} (${currentOfficer.officerId})`);
  updateOfficerWorkspace();
  loadCases();
}

function quickLoginOfficer(roleKey) {
  const officer = OFFICER_DIRECTORY[roleKey];
  if (officer) {
    currentOfficer = officer;
    const emailField = document.getElementById('officerEmail');
    if (emailField) emailField.value = officer.email;
    showToast(`🏛️ Authenticated: ${officer.name} (${officer.department})`);
    updateOfficerWorkspace();
    loadCases();
  }
}

function handleOfficerLogout() {
  currentOfficer = null;
  showToast("🔒 Logged out of Department Officer Desk.");
  updateOfficerWorkspace();
}

function updateOfficerWorkspace() {
  const gate = document.getElementById('officerAuthGate');
  const workspace = document.getElementById('officerWorkspace');

  if (!gate || !workspace) return;

  if (currentOfficer) {
    gate.style.display = 'none';
    workspace.style.display = 'block';

    const nameEl = document.getElementById('officerNameBadge');
    const idEl = document.getElementById('officerIdBadge');
    const deptEl = document.getElementById('officerDeptBadge');
    const filterDept = document.getElementById('filterDept');

    if (nameEl) nameEl.textContent = currentOfficer.name;
    if (idEl) idEl.textContent = `ID: ${currentOfficer.officerId}`;
    if (deptEl) deptEl.textContent = currentOfficer.department;
    if (filterDept && currentOfficer.filterKey !== 'all') {
      filterDept.value = currentOfficer.filterKey;
    }
  } else {
    gate.style.display = 'block';
    workspace.style.display = 'none';
  }
}

// Department Officer Desk Cases Queue
let allOfficerCases = [];

async function loadCases() {
  updateOfficerWorkspace();
  const tbody = document.getElementById('casesTableBody');
  if (!tbody || !currentOfficer) return;

  try {
    const res = await fetch(`${API_BASE}/cases`);
    if (res.ok) {
      allOfficerCases = await res.json();
      filterCases();
    }
  } catch (err) {
    console.warn("Error loading cases", err);
  }
}

function filterCases() {
  const tbody = document.getElementById('casesTableBody');
  if (!tbody) return;

  const deptFilter = document.getElementById('filterDept')?.value || 'all';
  const statusFilter = document.getElementById('filterStatus')?.value || 'all';

  let filtered = allOfficerCases;

  if (deptFilter !== 'all') {
    filtered = filtered.filter(c => c.routedDepartment.toLowerCase().includes(deptFilter.toLowerCase()));
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === statusFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No cases match the selected department / status filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr style="cursor:pointer;" onclick="openOfficerCaseReview(${c.id})">
      <td style="font-weight:800;color:var(--primary);">#${c.id}</td>
      <td style="font-weight:700;">${escapeHtml(c.category.replace(/_/g, ' ').toUpperCase())}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.complaintText)}</td>
      <td style="font-size:0.85rem;">${escapeHtml(c.routedDepartment)}</td>
      <td><span class="status-badge ${c.status.toLowerCase()}">${escapeHtml(c.status.replace(/_/g, ' '))}</span></td>
      <td style="font-weight:700;color:${c.citizenConfirmed === 'yes' ? 'var(--success)' : c.citizenConfirmed === 'no' ? 'var(--danger)' : 'var(--text-muted)'}">
        ${escapeHtml(c.citizenConfirmed.toUpperCase())}
      </td>
      <td>
        <button class="btn-secondary" style="font-size:0.75rem;padding:0.35rem 0.75rem;font-weight:800;" onclick="event.stopPropagation(); openOfficerCaseReview(${c.id});">
          Review & Action ➔
        </button>
      </td>
    </tr>
  `).join('');
}

// ── In-Place Officer Case Review & Action Modal ──
async function openOfficerCaseReview(caseId) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (!res.ok) { showToast("Could not load case docket."); return; }
    const c = await res.json();

    const modal = document.getElementById('officerDocketModal');
    const body = document.getElementById('officerModalBody');
    if (!modal || !body) return;

    const nextTransitions = {
      submitted: "ROUTED",
      routed: "UNDER PROCESS",
      under_process: "DISPOSED"
    };
    const nextStage = nextTransitions[c.status];
    const slaInfo = getSlaInfo(c);

    body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--border);padding-bottom:1rem;margin-bottom:1.25rem;">
        <div>
          <div style="font-size:0.72rem;font-weight:800;color:var(--primary);text-transform:uppercase;">🏛️ Nodal Officer Docket Inspection</div>
          <h2 style="font-size:1.3rem;font-weight:900;margin-top:0.15rem;">Case #${c.id} · ${escapeHtml(c.category.replace(/_/g, ' ').toUpperCase())}</h2>
        </div>
        <span class="status-badge ${c.status.toLowerCase()}">${escapeHtml(c.status.replace(/_/g, ' '))}</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.75rem;margin-bottom:1.25rem;background:#F8FAFC;padding:1rem;border-radius:var(--radius-md);border:1px solid var(--border);">
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);">Assigned Ministry</div>
          <div style="font-weight:800;font-size:0.85rem;color:var(--text-main);">${escapeHtml(c.routedDepartment)}</div>
        </div>
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);">Citizen Resolution Confirmation</div>
          <div style="font-weight:800;font-size:0.85rem;color:${c.citizenConfirmed === 'yes' ? 'var(--success)' : c.citizenConfirmed === 'no' ? 'var(--danger)' : 'var(--text-muted)'};">
            ${escapeHtml(c.citizenConfirmed.toUpperCase())}
          </div>
        </div>
        ${slaInfo ? `
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:${slaInfo.breached ? 'var(--danger)' : 'var(--primary)'};">SLA Compliance</div>
          <div style="font-weight:800;font-size:0.85rem;">${slaInfo.breached ? '🚨 Breached' : `${slaInfo.remainingDays} days remaining (SLA: ${slaInfo.sla}d)`}</div>
        </div>` : ''}
      </div>

      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.35rem;">Citizen Complaint Statement</div>
        <div style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.85rem;font-size:0.88rem;line-height:1.6;">
          ${escapeHtml(c.complaintText)}
        </div>
      </div>

      ${c.evidence && c.evidence.length > 0 ? `
      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.35rem;">Verified Citizen Evidence Checklist</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.5rem;">
          ${c.evidence.map(e => `
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.65rem;background:#FAFAF8;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.8rem;">
              <span>${e.present ? '✅' : '❌'}</span>
              <span style="font-weight:600;">${escapeHtml(e.description)}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      ${c.auditHash ? `
      <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.6rem 0.85rem;margin-bottom:1.25rem;font-size:0.75rem;">
        <span style="font-weight:700;color:var(--text-muted);">🔒 SHA-256 Audit Hash:</span>
        <code style="font-family:monospace;color:var(--primary-dark);font-size:0.72rem;word-break:break-all;">${escapeHtml(c.auditHash)}</code>
      </div>` : ''}

      <div style="margin-top:1.5rem;padding-top:1.25rem;border-top:1.5px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <button class="btn-secondary" onclick="closeOfficerModal()">Close Docket</button>
        ${nextStage ? `
        <button class="btn-primary" style="background:#E8793B;border-color:#D96B2F;" onclick="advanceCaseStatusFromOfficer(${c.id})">
          ⏩ Advance Department Status (➔ ${nextStage})
        </button>` : `
        <span style="font-size:0.85rem;font-weight:800;color:var(--text-muted);">
          ${c.status === 'disposed' ? '✅ Department Disposal Completed' : '⚖️ Case Appealed in CPGRAMS Queue'}
        </span>`}
      </div>
    `;

    modal.style.display = 'flex';
  } catch (err) {
    showToast("Error inspecting case docket.");
  }
}

function closeOfficerModal() {
  const modal = document.getElementById('officerDocketModal');
  if (modal) modal.style.display = 'none';
}

async function advanceCaseStatusFromOfficer(caseId) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/advance-status`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      showToast(`✅ Case #${caseId} advanced to: ${updated.status.toUpperCase()}`);
      openOfficerCaseReview(caseId); // Refresh modal in place
      await loadCases(); // Refresh queue in background
      await loadMetrics();
    } else {
      showToast("Cannot advance status further.");
    }
  } catch (err) {
    showToast("Error advancing case status.");
  }
}

async function openCaseInTracker(caseId) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (res.ok) {
      const caseObj = await res.json();
      currentTrackingCase = caseObj;
      switchView('assistant');
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.view === 'assistant'));
      renderTrackingView(caseObj);
      goToStep(7);
    }
  } catch (e) {
    console.warn("Could not open case", e);
  }
}

// Governance Metrics Tab
async function loadMetrics() {
  try {
    const [resMetrics, resCases] = await Promise.all([
      fetch(`${API_BASE}/metrics`),
      fetch(`${API_BASE}/cases`)
    ]);

    if (resMetrics.ok && resCases.ok) {
      const m = await resMetrics.json();
      const cases = await resCases.json();

      const elTotal = document.getElementById('metricTotalCases');
      const elDisposed = document.getElementById('metricDisposedCases');
      const elTrueResolution = document.getElementById('metricTrueResolution');
      const elAppeals = document.getElementById('metricAppeals');
      const elRoutingAccuracy = document.getElementById('metricRoutingAccuracy');

      const disposedCount = cases.filter(c => c.status === 'disposed' || c.status === 'appealed').length;
      const appealsCount = cases.filter(c => c.status === 'appealed' || Boolean(c.appealDraft)).length;

      // Animated counters for visual impact
      animateCounter('metricTotalCases', cases.length);
      animateCounter('metricDisposedCases', disposedCount);
      animateCounter('metricAppeals', appealsCount);
      animateCounter('metricTrueResolution', m.citizenConfirmedResolutionRate ?? 0, '%');
      animateCounter('metricRoutingAccuracy', m.correctlyRoutedPercentage ?? 100, '%');

      // Category breakdown with visual bars
      const breakdownEl = document.getElementById('metricsCategoryBreakdown');
      if (breakdownEl) {
        const categoryCounts = {};
        cases.forEach(c => {
          categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(categoryCounts), 1);
        breakdownEl.innerHTML = Object.entries(categoryCounts).map(([cat, count]) => {
          const pct = (count / maxCount) * 100;
          return `
            <div style="padding:0.7rem 0;border-bottom:1px solid var(--border);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem;">
                <span style="font-weight:700;font-size:0.85rem;">${escapeHtml(cat.replace(/_/g, ' ').toUpperCase())}</span>
                <span style="font-weight:900;color:var(--primary);font-size:0.9rem;">${count} cases</span>
              </div>
              <div style="background:#E2DDD5;border-radius:999px;height:6px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--primary-dark));border-radius:999px;transition:width 0.8s ease;"></div>
              </div>
            </div>
          `;
        }).join('');
      }

      // Disposal vs Resolution visual gap chart
      const gapChartEl = document.getElementById('disposalGapChart');
      if (gapChartEl && cases.length > 0) {
        const disposalRate = cases.length > 0 ? Math.round((disposedCount / cases.length) * 100) : 0;
        const resolutionRate = Math.round(m.citizenConfirmedResolutionRate ?? 0);
        const gap = disposalRate - resolutionRate;

        gapChartEl.innerHTML = `
          <div style="background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;margin-top:1.25rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
              <div style="font-size:0.85rem;font-weight:800;color:var(--text-main);">The Disposal ≠ Resolution Gap</div>
              <div style="font-size:1.5rem;font-weight:900;color:var(--danger);">${gap > 0 ? gap + '% gap' : 'Aligned'}</div>
            </div>
            <div style="display:flex;gap:0.75rem;align-items:flex-end;height:80px;">
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                <div style="font-size:1.1rem;font-weight:900;color:var(--saffron-dark);">${disposalRate}%</div>
                <div style="width:100%;background:linear-gradient(180deg,var(--saffron),var(--saffron-dark));border-radius:6px 6px 0 0;height:${Math.max(8, disposalRate * 0.7)}px;margin-top:0.3rem;transition:height 0.8s ease;"></div>
                <div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-top:0.3rem;text-align:center;">Admin Disposed</div>
              </div>
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                <div style="font-size:1.1rem;font-weight:900;color:${resolutionRate > 0 ? 'var(--success)' : 'var(--danger)'};">${resolutionRate}%</div>
                <div style="width:100%;background:linear-gradient(180deg,var(--success),#166534);border-radius:6px 6px 0 0;height:${Math.max(8, resolutionRate * 0.7)}px;margin-top:0.3rem;transition:height 0.8s ease;"></div>
                <div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-top:0.3rem;text-align:center;">Citizen Confirmed</div>
              </div>
            </div>
          </div>
        `;
      }
    }
  } catch (err) {
    console.warn("Metrics load failed", err);
  }
}

// Toast utility
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🔔</span> <span>${escapeHtml(msg)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Hackathon Pitch Brief Modal
function openHackathonModal() {
  const modal = document.getElementById('hackathonModal');
  if (modal) modal.style.display = 'flex';
}

function closeHackathonModal() {
  const modal = document.getElementById('hackathonModal');
  if (modal) modal.style.display = 'none';
}

// ── PDF Export: Print-friendly petition/appeal download ──
function exportPetitionPdf() {
  const petitionText = document.getElementById('petitionPreviewText')?.textContent ||
                       document.getElementById('appealTextContent')?.textContent || '';
  if (!petitionText) { showToast('No petition or appeal to export'); return; }

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>NyayaFlow — Official Grievance Document</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 2.5rem; color: #132A29; line-height: 1.7; }
        .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 3px solid #0F766E; }
        .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #0F766E, #0D5D57); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 1.2rem; }
        .title { font-size: 1.4rem; font-weight: 800; color: #0F766E; }
        .subtitle { font-size: 0.85rem; color: #4B6361; }
        .tricolor { height: 4px; background: linear-gradient(90deg, #FF9933 0%, #fff 50%, #138808 100%); margin-bottom: 1.5rem; }
        .doc-body { white-space: pre-wrap; font-size: 0.95rem; background: #FAFAF8; border: 1px solid #E2DDD5; border-radius: 8px; padding: 1.5rem; }
        .footer { margin-top: 2rem; font-size: 0.8rem; color: #4B6361; text-align: center; border-top: 1px solid #E2DDD5; padding-top: 1rem; }
        .hash { font-family: monospace; font-size: 0.7rem; color: #6B7280; word-break: break-all; }
        @media print { body { padding: 1rem; } .doc-body { border: none; background: #fff; } }
      </style>
    </head>
    <body>
      <div class="tricolor"></div>
      <div class="header">
        <div class="logo">NF</div>
        <div>
          <div class="title">NyayaFlow — Official Citizen Grievance Document</div>
          <div class="subtitle">Deterministic & Explainable Indian Citizen Grievance Redressal Platform</div>
        </div>
      </div>
      <div class="doc-body">${escapeHtml(petitionText)}</div>
      ${currentTrackingCase?.auditHash ? `<div class="hash" style="margin-top:1rem;">🔒 SHA-256 Audit Hash: ${escapeHtml(currentTrackingCase.auditHash)}</div>` : ''}
      <div class="footer">
        Generated by NyayaFlow Engine · ${new Date().toLocaleString('en-IN')} · BuildWhatMovesIndia Hackathon
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ── Animated Counter (for metrics dashboard) ──
function animateCounter(elementId, targetValue, suffix = '', duration = 1200) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const isPercent = suffix === '%';
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (targetValue - start) * eased * (isPercent ? 100 : 1)) / (isPercent ? 100 : 1);
    el.textContent = isPercent ? `${current.toFixed(current % 1 === 0 ? 0 : 2)}${suffix}` : `${Math.round(current)}${suffix}`;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── SLA Breach Calculator ──
function getSlaInfo(caseObj) {
  if (!caseObj || !caseObj.timeline || caseObj.timeline.length === 0) return null;
  const sla = SLA_DAYS[caseObj.status];
  if (!sla) return null; // disposed/appealed have no SLA

  const lastEvent = caseObj.timeline[caseObj.timeline.length - 1];
  const lastTimestamp = new Date(lastEvent.timestamp);
  const now = new Date();
  const elapsedMs = now - lastTimestamp;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const remainingDays = Math.max(0, sla - elapsedDays);
  const breached = elapsedDays > sla;

  return { sla, elapsedDays: Math.round(elapsedDays * 10) / 10, remainingDays: Math.round(remainingDays * 10) / 10, breached };
}

// ── Register Service Worker for PWA/Offline ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/sw.js').catch(() => {});
  });
}
