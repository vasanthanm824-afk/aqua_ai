export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  flag?: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", speechCode: "en-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechCode: "ml-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechCode: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechCode: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechCode: "pa-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", speechCode: "or-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", speechCode: "as-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", speechCode: "ur-IN" },
];

export interface TranslationStrings {
  languageCode?: string;
  title: string;
  subtitle: string;
  steps: {
    language: string;
    description: string;
    evidence: string;
    location: string;
    review: string;
    completed: string;
  };
  language: {
    selectTitle: string;
    selectPrompt: string;
    continueBtn: string;
  };
  voice: {
    voiceBtn: string;
    listening: string;
    speakNow: string;
    stopBtn: string;
    transcribing: string;
    transcriptionTitle: string;
    editBtn: string;
    recordAgainBtn: string;
    typeInstead: string;
    voiceFallbackNotice: string;
  };
  complaint: {
    categoryLabel: string;
    categorySelect: string;
    titleLabel: string;
    titlePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    serviceAffected: string;
    servicePlaceholder: string;
    categories: Record<string, string>;
  };
  evidence: {
    title: string;
    subtitle: string;
    badgeRequired: string;
    cameraPrompt: string;
    takeLivePhoto: string;
    retakeBtn: string;
    usePhotoBtn: string;
    permissionDenied: string;
    permissionInstructions: string;
    previewTitle: string;
    timestamp: string;
    mandatoryAlert: string;
  };
  location: {
    title: string;
    subtitle: string;
    detectBtn: string;
    detecting: string;
    accuracy: string;
    latLng: string;
    recaptureBtn: string;
    permissionDenied: string;
    accuracyLowWarning: string;
    accuracyNotice: string;
    communityDetected: string;
  };
  routing: {
    title: string;
    category: string;
    locality: string;
    jurisdiction: string;
    department: string;
    statusReady: string;
    transparencyNote: string;
  };
  review: {
    title: string;
    subtitle: string;
    submitBtn: string;
    submitting: string;
    backBtn: string;
    anonymousToggle: string;
    anonymousDesc: string;
    contactOptional: string;
    contactPhone: string;
  };
  success: {
    title: string;
    trackingIdLabel: string;
    statusLabel: string;
    deptLabel: string;
    submittedAt: string;
    copyBtn: string;
    copied: string;
    trackBtn: string;
    newComplaintBtn: string;
  };
}

export const COMPLAINT_TRANSLATIONS: Record<string, TranslationStrings> = {
  en: {
    title: "REGISTER A NEW GRIEVANCE",
    subtitle: "Aqua-Lens Multilingual Citizen Water & Sanitation Complaint Portal",
    steps: {
      language: "1. Language",
      description: "2. Description",
      evidence: "3. Live Evidence",
      location: "4. GPS Location",
      review: "5. Review & Submit",
      completed: "6. Registered",
    },
    language: {
      selectTitle: "SELECT YOUR PREFERRED LANGUAGE",
      selectPrompt: "Choose your primary language to speak or write your grievance:",
      continueBtn: "Continue to Grievance Details →",
    },
    voice: {
      voiceBtn: "🎙 VOICE TO RAISE A COMPLAINT",
      listening: "Listening... Speak your complaint clearly into your microphone",
      speakNow: "Speak now in your chosen language...",
      stopBtn: "⏹ Stop & Transcribe",
      transcribing: "Processing speech to text...",
      transcriptionTitle: "TRANSCRIBED COMPLAINT (REVIEW BEFORE SUBMITTING)",
      editBtn: "✏️ Edit Text",
      recordAgainBtn: "🔄 Record Again",
      typeInstead: "Or Type Complaint Manually",
      voiceFallbackNotice: "Voice recognition unavailable in this browser. Please type your grievance below.",
    },
    complaint: {
      categoryLabel: "Complaint Category *",
      categorySelect: "Select appropriate category",
      titleLabel: "Brief Grievance Summary *",
      titlePlaceholder: "e.g. Severely discolored tap water in Main Street",
      descLabel: "Detailed Description *",
      descPlaceholder: "Describe the water/sanitation issue, how long it has persisted, and affected residents...",
      serviceAffected: "Affected Infrastructure / Service",
      servicePlaceholder: "e.g. Overhead Tank, Public Standpost, Borewell, Street Drain",
      categories: {
        WATER_SUPPLY: "Water Supply (No flow / Low pressure)",
        WATER_QUALITY: "Water Quality (Color, Odor, Salinity, Contamination)",
        SANITATION: "Sanitation (Community Toilet / Septage / SBM)",
        DRAINAGE: "Drainage & Sewer Blockage",
        FLOODING: "Flooding & Waterlogging Hazard",
        INFRASTRUCTURE: "Infrastructure Defect (Broken pipe, Leaking tank)",
        WASTE_MANAGEMENT: "Waste Management (Dumped refuse near water source)",
        OTHER: "Other Grievance",
      },
    },
    evidence: {
      title: "LIVE EVIDENCE PHOTO",
      subtitle: "Live camera capture required to verify ground-truth situation",
      badgeRequired: "LIVE CAMERA CAPTURE REQUIRED",
      cameraPrompt: "Take an immediate live photo of the issue using your device camera.",
      takeLivePhoto: "📷 TAKE LIVE PHOTO",
      retakeBtn: "🔄 Retake Photo",
      usePhotoBtn: "✓ Confirm & Use Live Photo",
      permissionDenied: "Camera Permission Denied",
      permissionInstructions: "Please enable camera access in your browser settings to verify live evidence.",
      previewTitle: "LIVE PHOTO CAPTURED",
      timestamp: "Captured at",
      mandatoryAlert: "A live camera photo is required to submit this grievance. Gallery uploads are disabled.",
    },
    location: {
      title: "CONFIRM GPS LOCATION",
      subtitle: "Location access required to identify administrative jurisdiction and responsible department",
      detectBtn: "📍 DETECT CURRENT GPS LOCATION",
      detecting: "Acquiring satellite GPS fix...",
      accuracy: "GPS Accuracy",
      latLng: "Coordinates",
      recaptureBtn: "🔄 Re-Capture Location",
      permissionDenied: "Location Permission Denied",
      accuracyLowWarning: "Location Accuracy is Low (> 100m). For faster resolution, re-capture in an open area.",
      accuracyNotice: "Exact GPS obtained directly from your device hardware, not inferred from network IP.",
      communityDetected: "Nearest Aqua-Lens Settlement Identified",
    },
    routing: {
      title: "COMPLAINT ROUTING TRANSPARENCY",
      category: "Grievance Category",
      locality: "Location / Community",
      jurisdiction: "Administrative Jurisdiction",
      department: "Responsible Department / Authority",
      statusReady: "READY FOR SUBMISSION",
      transparencyNote: "Your complaint will be forwarded directly to the designated department queue with full audit tracking.",
    },
    review: {
      title: "REVIEW YOUR GRIEVANCE",
      subtitle: "Please verify all information before official submission",
      submitBtn: "SUBMIT OFFICIAL GRIEVANCE",
      submitting: "Submitting to Jurisdiction Queue...",
      backBtn: "← Back / Edit",
      anonymousToggle: "Submit Anonymously",
      anonymousDesc: "Your name and mobile will not be visible to public officers or administrative dashboards.",
      contactOptional: "Citizen Contact Information",
      contactPhone: "Mobile / Phone Number (Optional for SMS updates)",
    },
    success: {
      title: "GRIEVANCE REGISTERED SUCCESSFULLY",
      trackingIdLabel: "Unique Tracking ID",
      statusLabel: "Initial Status",
      deptLabel: "Assigned Authority",
      submittedAt: "Submission Timestamp",
      copyBtn: "Copy Tracking ID",
      copied: "Copied to Clipboard!",
      trackBtn: "Track This Complaint →",
      newComplaintBtn: "Register Another Grievance",
    },
  },

  ta: {
    title: "புதிய குறைதீர்ப்பு பதிவு",
    subtitle: "அக்வா-லென்ஸ் பன்மொழி குடிநீர் & சுகாதார பொதுமக்கள் புகார் போர்டல்",
    steps: {
      language: "1. மொழி",
      description: "2. புகார் விவரம்",
      evidence: "3. நேரடி புகைப்படம்",
      location: "4. இருப்பிடம் (GPS)",
      review: "5. மதிப்பாய்வு",
      completed: "6. பதிவு செய்யப்பட்டது",
    },
    language: {
      selectTitle: "உங்கள் மொழியைத் தேர்வுசெய்யவும்",
      selectPrompt: "புகாரைப் பேச அல்லது தட்டச்சு செய்ய உங்கள் முதன்மை மொழியைத் தேர்வுசெய்யவும்:",
      continueBtn: "புகார் விவரங்களுக்குச் செல்லவும் →",
    },
    voice: {
      voiceBtn: "🎙 குரல் மூலம் புகார் பதிவு செய்யவும்",
      listening: "கேட்கிறது... உங்கள் குறையை மைக்ரோஃபோனில் தெளிவாகப் பேசுங்கள்",
      speakNow: "இப்போது உங்கள் தாய்மொழியில் பேசுங்கள்...",
      stopBtn: "⏹ நிறுத்து & உரையாக மாற்று",
      transcribing: "பேச்சை எழுத்தாக மாற்றுகிறது...",
      transcriptionTitle: "எழுதப்பட்ட புகார் (சமர்ப்பிக்கும் முன் சரிபார்க்கவும்)",
      editBtn: "✏️ திருத்தவும்",
      recordAgainBtn: "🔄 மீண்டும் பேசவும்",
      typeInstead: "அல்லது கைமுறையாக தட்டச்சு செய்யவும்",
      voiceFallbackNotice: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. கீழே தட்டச்சு செய்யவும்.",
    },
    complaint: {
      categoryLabel: "புகார் வகை *",
      categorySelect: "சரியான வகையைத் தேர்ந்தெடுக்கவும்",
      titleLabel: "சுருக்கமான தலைப்பு *",
      titlePlaceholder: "எ.கா. பிரதான வீதியில் கலங்கலான குடிநீர் வருகிறது",
      descLabel: "விளக்கமான விவரம் *",
      descPlaceholder: "குடிநீர்/சுகாதாரப் பிரச்சனை, எத்தனை நாட்களாக உள்ளது போன்ற விவரங்களை விவரிக்கவும்...",
      serviceAffected: "பாதிக்கப்பட்ட கட்டமைப்பு / சேவை",
      servicePlaceholder: "எ.கா. மேல்நிலை நீர்த்தேக்கத் தொட்டி, பொது குழாய், ஆழ்துளை கிணறு",
      categories: {
        WATER_SUPPLY: "குடிநீர் விநியோகம் (நீர் வரவில்லை / குறைந்த அழுத்தம்)",
        WATER_QUALITY: "குடிநீர் தரம் (நிறம், துர்நாற்றம், உவர்ப்பு, மாசு)",
        SANITATION: "சுகாதாரம் (பொது கழிப்பறை / கழிவுநீர்)",
        DRAINAGE: "வடிகால் & சாக்கடை அடைப்பு",
        FLOODING: "வெள்ளம் & நீர் தேக்கம்",
        INFRASTRUCTURE: "கட்டமைப்பு சேதம் (உடைந்த குழாய், கசியும் தொட்டி)",
        WASTE_MANAGEMENT: "திடக்கழிவு மேலாண்மை (நீர்நிலை அருகே குப்பை)",
        OTHER: "இதர புகார்கள்",
      },
    },
    evidence: {
      title: "நேரடி ஆதாரப் புகைப்படம்",
      subtitle: "உண்மை நிலையைச் சரிபார்க்க கேமரா மூலம் நேரடி புகைப்படம் கட்டாயம்",
      badgeRequired: "நேரடி கேமரா புகைப்படம் கட்டாயம்",
      cameraPrompt: "உங்கள் சாதன கேமராவைப் பயன்படுத்தி சம்பவ இடத்தைப் புகைப்படம் எடுக்கவும்.",
      takeLivePhoto: "📷 நேரடி புகைப்படம் எடுக்கவும்",
      retakeBtn: "🔄 மீண்டும் எடுக்கவும்",
      usePhotoBtn: "✓ புகைப்படத்தை உறுதிசெய்",
      permissionDenied: "கேமரா அனுமதி மறுக்கப்பட்டது",
      permissionInstructions: "நேரடி ஆதாரத்தை எடுக்க உங்கள் உலாவி அமைப்புகளில் கேமரா அணுகலை அனுமதிக்கவும்.",
      previewTitle: "நேரடி புகைப்படம் எடுக்கப்பட்டது",
      timestamp: "நேரம்",
      mandatoryAlert: "புகாரைப் பதிவு செய்ய நேரடி புகைப்படம் கட்டாயம். கேலரி பதிவேற்றம் அனுமதிக்கப்படாது.",
    },
    location: {
      title: "இருப்பிடத்தை உறுதிசெய் (GPS)",
      subtitle: "துறையைத் தீர்மானிக்க உங்கள் தற்போதைய GPS இருப்பிடம் தேவை",
      detectBtn: "📍 தற்போதைய இருப்பிடத்தைக் கண்டறி",
      detecting: "GPS சிக்னல் பெறப்படுகிறது...",
      accuracy: "துல்லியம்",
      latLng: "அட்சரேகை / தீர்க்கரேகை",
      recaptureBtn: "🔄 மீண்டும் கண்டறி",
      permissionDenied: "இருப்பிட அனுமதி மறுக்கப்பட்டது",
      accuracyLowWarning: "GPS துல்லியம் குறைவாக உள்ளது. திறந்த வெளியில் மீண்டும் முயற்சிக்கவும்.",
      accuracyNotice: "நேரடி சாதன GPS மூலம் பெறப்பட்டது (IP முகவரி அல்ல).",
      communityDetected: "அருகிலுள்ள அக்வா-லென்ஸ் குடியிருப்பு",
    },
    routing: {
      title: "புகார் அனுப்பப்படும் துறை விவரம்",
      category: "புகார் வகை",
      locality: "இருப்பிடம் / கிராமம்",
      jurisdiction: "நிர்வாக வரம்பு",
      department: "பொறுப்பான துறை / வாரியம்",
      statusReady: "சமர்ப்பிக்கத் தயார்",
      transparencyNote: "உங்கள் புகார் நேரடியாக சம்பந்தப்பட்ட அரசுத் துறைக்கு அனுப்பப்படும்.",
    },
    review: {
      title: "உங்கள் புகாரை சரிபார்க்கவும்",
      subtitle: "சமர்ப்பிக்கும் முன் அனைத்து தகவல்களையும் சரிபார்க்கவும்",
      submitBtn: "புகாரை அதிகாரப்பூர்வமாக சமர்ப்பிக்கவும்",
      submitting: "பதிவாகிறது...",
      backBtn: "← பின்செல் / திருத்து",
      anonymousToggle: "பெயர் குறிப்பிடாமல் சமர்ப்பிக்கவும்",
      anonymousDesc: "உங்கள் பெயர் மற்றும் தொடர்பு விவரங்கள் அதிகாரிகளுக்குத் தெரியாது.",
      contactOptional: "தொடர்பு விவரங்கள் (விரும்பினால்)",
      contactPhone: "மொபைல் எண் (SMS தகவல்களுக்கு)",
    },
    success: {
      title: "புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது",
      trackingIdLabel: "தனித்துவ கண்காணிப்பு எண் (Tracking ID)",
      statusLabel: "தற்போதைய நிலை",
      deptLabel: "ஒதுக்கப்பட்ட துறை",
      submittedAt: "பதிவு செய்யப்பட்ட நேரம்",
      copyBtn: "எண்ணை நகலெடு",
      copied: "நகலெடுக்கப்பட்டது!",
      trackBtn: "புகாரைக் கண்காணிக்கவும் →",
      newComplaintBtn: "மற்றொரு புகாரைப் பதிவுசெய்",
    },
  },

  hi: {
    title: "नई शिकायत दर्ज करें",
    subtitle: "एक्वा-लेंस बहुभाषी नागरिक जल एवं स्वच्छता शिकायत निवारण पोर्टल",
    steps: {
      language: "1. भाषा",
      description: "2. शिकायत विवरण",
      evidence: "3. लाइव फोटो",
      location: "4. जीपीएस स्थान",
      review: "5. समीक्षा",
      completed: "6. दर्ज",
    },
    language: {
      selectTitle: "अपनी पसंदीदा भाषा चुनें",
      selectPrompt: "शिकायत बोलने या लिखने के लिए अपनी भाषा का चयन करें:",
      continueBtn: "विवरण पर आगे बढ़ें →",
    },
    voice: {
      voiceBtn: "🎙 बोलकर शिकायत दर्ज करें",
      listening: "सुन रहे हैं... कृपया माइक्रोफ़ोन में स्पष्ट रूप से बोलें",
      speakNow: "अब अपनी चुनी हुई भाषा में बोलें...",
      stopBtn: "⏹ रोकें और टेक्स्ट में बदलें",
      transcribing: "आवाज को टेक्स्ट में बदला जा रहा है...",
      transcriptionTitle: "दर्ज की गई शिकायत (जमा करने से पहले जांचें)",
      editBtn: "✏️ संपादित करें",
      recordAgainBtn: "🔄 दोबारा बोलें",
      typeInstead: "या मैन्युअल रूप से टाइप करें",
      voiceFallbackNotice: "इस ब्राउज़र में वॉयस इनपुट उपलब्ध नहीं है। कृपया नीचे टाइप करें।",
    },
    complaint: {
      categoryLabel: "शिकायत की श्रेणी *",
      categorySelect: "उपयुक्त श्रेणी चुनें",
      titleLabel: "शिकायत का संक्षिप्त सारांश *",
      titlePlaceholder: "उदा. मुख्य सड़क पर गंदा पानी आ रहा है",
      descLabel: "विस्तृत विवरण *",
      descPlaceholder: "समस्या का विस्तार से विवरण दें, यह कितने समय से बनी हुई है...",
      serviceAffected: "प्रभावित सेवा / संरचना",
      servicePlaceholder: "उदा. ओवरहेड टैंक, सार्वजनिक नल, हैंडपंप, नाली",
      categories: {
        WATER_SUPPLY: "जल आपूर्ति (पानी नहीं आ रहा / कम दबाव)",
        WATER_QUALITY: "पानी की गुणवत्ता (रंग, गंध, खारापन, प्रदूषण)",
        SANITATION: "स्वच्छता (शौचालय / सेप्टेज)",
        DRAINAGE: "नाली और सीवरेज रुकावट",
        FLOODING: "जलभराव एवं बाढ़ का खतरा",
        INFRASTRUCTURE: "बुनियादी ढांचा खराबी (टूटी पाइपलाइन, लीकेज)",
        WASTE_MANAGEMENT: "कचरा प्रबंधन (जल स्रोत के पास कचरा)",
        OTHER: "अन्य शिकायत",
      },
    },
    evidence: {
      title: "लाइव साक्ष्य फोटो",
      subtitle: "सत्यापन के लिए डिवाइस कैमरे से लाइव फोटो आवश्यक है",
      badgeRequired: "लाइव कैमरा फोटो अनिवार्य",
      cameraPrompt: "अपने डिवाइस कैमरे से समस्या की तत्काल लाइव तस्वीर लें।",
      takeLivePhoto: "📷 लाइव फोटो लें",
      retakeBtn: "🔄 दोबारा लें",
      usePhotoBtn: "✓ फोटो की पुष्टि करें",
      permissionDenied: "कैमरा अनुमति अस्वीकृत",
      permissionInstructions: "लाइव साक्ष्य के लिए कृपया ब्राउज़र सेटिंग्स में कैमरा चालू करें।",
      previewTitle: "लाइव फोटो खींची गई",
      timestamp: "समय",
      mandatoryAlert: "शिकायत दर्ज करने के लिए लाइव कैमरा फोटो अनिवार्य है। गैलरी से अपलोड अमान्य है।",
    },
    location: {
      title: "जीपीएस स्थान की पुष्टि करें",
      subtitle: "संबंधित विभाग की पहचान के लिए आपका सटीक स्थान आवश्यक है",
      detectBtn: "📍 वर्तमान स्थान प्राप्त करें",
      detecting: "जीपीएस सिग्नल प्राप्त हो रहा है...",
      accuracy: "सटीकता",
      latLng: "निर्देशांक",
      recaptureBtn: "🔄 पुनः स्थान प्राप्त करें",
      permissionDenied: "स्थान अनुमति अस्वीकृत",
      accuracyLowWarning: "जीपीएस सटीकता कम है। कृपया खुले स्थान में पुनः प्रयास करें।",
      accuracyNotice: "डिवाइस हार्डवेयर जीपीएस से प्राप्त (आईपी पता नहीं)।",
      communityDetected: "निकटतम एक्वा-लेंस बस्ती की पहचान",
    },
    routing: {
      title: "शिकायत प्रेषण पारदर्शिता",
      category: "शिकायत श्रेणी",
      locality: "स्थान / ग्राम",
      jurisdiction: "प्रशासनिक क्षेत्राधिकार",
      department: "उत्तरदायी विभाग / बोर्ड",
      statusReady: "जमा करने के लिए तैयार",
      transparencyNote: "आपकी शिकायत सीधे संबंधित विभाग के पोर्टल पर अग्रेषित की जाएगी।",
    },
    review: {
      title: "अपनी शिकायत की समीक्षा करें",
      subtitle: "जमा करने से पहले सभी जानकारियों की पुष्टि करें",
      submitBtn: "आधिकारिक शिकायत दर्ज करें",
      submitting: "दर्ज की जा रही है...",
      backBtn: "← वापस / सुधारें",
      anonymousToggle: "गुमनाम रूप से जमा करें",
      anonymousDesc: "आपका नाम और मोबाइल नंबर प्रशासनिक अधिकारियों को दिखाई नहीं देगा।",
      contactOptional: "नागरिक संपर्क विवरण (वैकल्पिक)",
      contactPhone: "मोबाइल नंबर (एसएमएस अपडेट के लिए)",
    },
    success: {
      title: "शिकायत सफलतापूर्वक दर्ज की गई",
      trackingIdLabel: "यूनिक ट्रैकिंग आईडी",
      statusLabel: "प्रारंभिक स्थिति",
      deptLabel: "आवंटित विभाग",
      submittedAt: "दर्ज समय",
      copyBtn: "आईडी कॉपी करें",
      copied: "कॉपी हो गया!",
      trackBtn: "शिकायत ट्रैक करें →",
      newComplaintBtn: "दूसरी शिकायत दर्ज करें",
    },
  },

  te: {
    title: "కొత్త ఫిర్యాదును నమోదు చేయండి",
    subtitle: "ఆక్వా-లెన్స్ బహుభాషా పౌర నీరు & పారిశుద్ధ్య ఫిర్యాదుల పోర్టల్",
    steps: {
      language: "1. భాష",
      description: "2. ఫిర్యాదు వివరాలు",
      evidence: "3. ప్రత్యక్ష ఫోటో",
      location: "4. GPS స్థానం",
      review: "5. సమీక్ష",
      completed: "6. నమోదైంది",
    },
    language: {
      selectTitle: "మీ భాషను ఎంచుకోండి",
      selectPrompt: "ఫిర్యాదు మాట్లాడటానికి లేదా రాయడానికి మీ భాషను ఎంచుకోండి:",
      continueBtn: "వివరాలకు వెళ్లండి →",
    },
    voice: {
      voiceBtn: "🎙 వాయిస్ ద్వారా ఫిర్యాదు చేయండి",
      listening: "వింటోంది... మైక్రోఫోన్‌లో స్పష్టంగా మాట్లాడండి",
      speakNow: "ఇప్పుడు మీ భాషలో మాట్లాడండి...",
      stopBtn: "⏹ ఆపి టెక్స్ట్‌గా మార్చు",
      transcribing: "వాయిస్ ప్రాసెస్ అవుతోంది...",
      transcriptionTitle: "నమోదైన ఫిర్యాదు (సమర్పించే ముందు సరిచూడండి)",
      editBtn: "✏️ సవరించు",
      recordAgainBtn: "🔄 మళ్లీ రికార్డ్ చేయి",
      typeInstead: "లేదా టైప్ చేయండి",
      voiceFallbackNotice: "వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు. దయచేసి టైప్ చేయండి.",
    },
    complaint: {
      categoryLabel: "ఫిర్యాదు వర్గం *",
      categorySelect: "సరైన వర్గాన్ని ఎంచుకోండి",
      titleLabel: "సంక్షిప్త శీర్షిక *",
      titlePlaceholder: "ఉదా. ప్రధాన రహదారిలో మురికి నీరు వస్తోంది",
      descLabel: "వివరణాత్మక వివరాలు *",
      descPlaceholder: "నీటి సమస్య లేదా పారిశుద్ధ్య లోపాన్ని వివరించండి...",
      serviceAffected: "ప్రభావితమైన నిర్మాణం",
      servicePlaceholder: "ఉదా. ఓవర్‌హెడ్ ట్యాంక్, పబ్లిక్ కుళాయి, డ్రైనేజ్",
      categories: {
        WATER_SUPPLY: "నీటి సరఫరా (నీరు రాలేదు / తక్కువ పీడనం)",
        WATER_QUALITY: "నీటి నాణ్యత (రంగు, వాసన, కాలుష్యం)",
        SANITATION: "పారిశుద్ధ్యం (మరుగుదొడ్లు / వ్యర్థాలు)",
        DRAINAGE: "డ్రైనేజీ పూడిక & అడ్డంకి",
        FLOODING: "వరద & నీటి నిల్వ",
        INFRASTRUCTURE: "పైపులైన్ లీకేజీ / లోపాలు",
        WASTE_MANAGEMENT: "చెత్త నిర్వహణ",
        OTHER: "ఇతర ఫిర్యాదులు",
      },
    },
    evidence: {
      title: "ప్రత్యక్ష ఫోటో సాక్ష్యం",
      subtitle: "సమస్యను ధృవీకరించడానికి లైవ్ కెమెరా ఫోటో అవసరం",
      badgeRequired: "లైవ్ కెమెరా ఫోటో తప్పనిసరి",
      cameraPrompt: "మీ పరికర కెమెరాతో ప్రత్యక్ష ఫోటో తీయండి.",
      takeLivePhoto: "📷 లైవ్ ఫోటో తీయండి",
      retakeBtn: "🔄 మళ్లీ తీయండి",
      usePhotoBtn: "✓ ఫోటోను నిర్ధారించండి",
      permissionDenied: "కెమెరా అనుమతి నిరాకరించబడింది",
      permissionInstructions: "బ్రౌజర్ సెట్టింగ్స్‌లో కెమెరా అనుమతించండి.",
      previewTitle: "ఫోటో తీయబడింది",
      timestamp: "సమయం",
      mandatoryAlert: "ఫిర్యాదు నమోదు చేయడానికి లైవ్ ఫోటో తప్పనిసరి. గ్యాలరీ ఫోటోలు చెల్లవు.",
    },
    location: {
      title: "GPS స్థానాన్ని నిర్ధారించండి",
      subtitle: "సంబంధిత విభాగాన్ని నిర్ణయించడానికి ఖచ్చితమైన GPS అవసరం",
      detectBtn: "📍 ప్రస్తుత స్థానాన్ని పొందండి",
      detecting: "GPS సిగ్నల్ సేకరిస్తోంది...",
      accuracy: "ఖచ్చితత్వం",
      latLng: "కోఆర్డినేట్లు",
      recaptureBtn: "🔄 మళ్లీ పొందండి",
      permissionDenied: "స్థాన అనుమతి నిరాకరించబడింది",
      accuracyLowWarning: "ఖచ్చితత్వం తక్కువగా ఉంది. ఓపెన్ ప్రదేశంలో మళ్లీ ప్రయత్నించండి.",
      accuracyNotice: "డివైస్ GPS ద్వారా పొందబడింది.",
      communityDetected: "గుర్తించిన సమీప గ్రామం",
    },
    routing: {
      title: "ఫిర్యాదు విభాగం వివరాలు",
      category: "వర్గం",
      locality: "గ్రామం / ప్రాంతం",
      jurisdiction: "పరిపాలనా పరిధి",
      department: "బాధ్యత గల విభాగం",
      statusReady: "సమర్పణకు సిద్ధంగా ఉంది",
      transparencyNote: "మీ ఫిర్యాదు నేరుగా సంబంధిత ప్రభుత్వ విభాగానికి పంపబడుతుంది.",
    },
    review: {
      title: "ఫిర్యాదును సరిచూసుకోండి",
      subtitle: "సమర్పించే ముందు వివరాలను తనిఖీ చేయండి",
      submitBtn: "అధికారికంగా సమర్పించండి",
      submitting: "నమోదవుతోంది...",
      backBtn: "← వెనుకకు / మార్చు",
      anonymousToggle: "అనామకంగా సమర్పించండి",
      anonymousDesc: "మీ వివరాలు అధికారులకు కనిపించవు.",
      contactOptional: "సంప్రదింపు వివరాలు",
      contactPhone: "మొబైల్ సంఖ్య (SMS కోసం)",
    },
    success: {
      title: "ఫిర్యాదు విజయవంతంగా నమోదైంది",
      trackingIdLabel: "ట్రాకింగ్ ఐడీ (Tracking ID)",
      statusLabel: "స్థితి",
      deptLabel: "కేటాయించిన విభాగం",
      submittedAt: "నమోదైన సమయం",
      copyBtn: "ఐడీ కాపీ చేయండి",
      copied: "కాపీ చేయబడింది!",
      trackBtn: "ఫిర్యాదును ట్రాక్ చేయండి →",
      newComplaintBtn: "మరో ఫిర్యాదు చేయండి",
    },
  },
};

// Helper to get translation with fallback to English
export function getComplaintTranslation(langCode: string): TranslationStrings {
  const dict = COMPLAINT_TRANSLATIONS[langCode] || COMPLAINT_TRANSLATIONS.en;
  const resolvedCode = COMPLAINT_TRANSLATIONS[langCode] ? langCode : "en";
  return {
    ...dict,
    languageCode: resolvedCode,
  };
}

