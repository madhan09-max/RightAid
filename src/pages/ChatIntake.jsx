import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/translations';
import { evaluateAllSchemes } from '../engine/rulesEngine';
import { runFullValidation } from '../engine/validator';
import { runFullRiskAssessment } from '../engine/riskEngine';
import { getTaluksByDistrict } from '../data/locations';
import VoiceButton from '../components/VoiceButton';
import SOSButton from '../components/SOSButton';

export default function ChatIntake() {
  const navigate = useNavigate();
  const {
    language,
    userData,
    updateUserData,
    setResults,
    saveSession,
    addToast,
    validationResults,
    setValidationResults,
    riskAssessment,
    setRiskAssessment,
    trackingStatus,
    setTrackingStatus
  } = useAppContext();

  const t = (key, fallback) => translations?.[language]?.[key] || translations?.en?.[key] || fallback;

  // Question configurations with 4-pillar expansion fields
  const rawQuestions = [
    {
      id: 'name',
      type: 'text',
      simulatedVoice: 'Surya',
      prompt: {
        en: 'What is your name?',
        ta: 'உங்கள் பெயர் என்ன?',
        hi: 'आपका नाम क्या है?'
      },
      placeholder: {
        en: 'Enter your full name...',
        ta: 'உங்கள் முழுப் பெயரை உள்ளிடவும்...',
        hi: 'अपना पूरा नाम दर्ज करें...'
      }
    },
    {
      id: 'age',
      type: 'number',
      simulatedVoice: '25',
      prompt: {
        en: 'How old are you?',
        ta: 'உங்கள் வயது என்ன?',
        hi: 'आपकी उम्र क्या है?'
      },
      placeholder: {
        en: 'e.g., 25',
        ta: 'எ.கா., 25',
        hi: 'उदा. 25'
      }
    },
    {
      id: 'gender',
      type: 'options',
      prompt: {
        en: 'What is your gender?',
        ta: 'உங்கள் பாலினம் என்ன?',
        hi: 'आपका लिंग क्या है?'
      },
      options: [
        { value: 'Male', label: { en: 'Male', ta: 'ஆண்', hi: 'पुरुष' }, icon: 'male' },
        { value: 'Female', label: { en: 'Female', ta: 'பெண்', hi: 'महिला' }, icon: 'female' },
        { value: 'Other', label: { en: 'Other', ta: 'மற்றவை', hi: 'अन्य' }, icon: 'transgender' }
      ]
    },
    {
      id: 'education',
      type: 'number',
      simulatedVoice: '10',
      prompt: {
        en: 'What class did you study up to?',
        ta: 'நீங்கள் எந்த வகுப்பு வரை படித்துள்ளீர்கள்?',
        hi: 'आपने किस कक्षा तक पढ़ाई की है?'
      },
      helper: {
        en: 'Enter standard (e.g., 5 means 5th standard, 10 means 10th standard, 12 means 12th)',
        ta: 'வகுப்பை உள்ளிடவும் (எ.கா. 5 என்றால் 5-ஆம் வகுப்பு, 10 என்றால் 10-ஆம் வகுப்பு)',
        hi: 'कक्षा दर्ज करें (उदा. 5 मतलब 5वीं कक्षा, 10 मतलब 10वीं कक्षा)'
      },
      placeholder: {
        en: 'e.g., 10',
        ta: 'எ.கா., 10',
        hi: 'उदा. 10'
      }
    },
    {
      id: 'income',
      type: 'number',
      simulatedVoice: '120000',
      prompt: {
        en: "What is your family's yearly income in rupees?",
        ta: 'உங்கள் குடும்பத்தின் ஆண்டு வருமானம் ரூபாயில் எவ்வளவு?',
        hi: 'आपके परिवार की वार्षिक आय (रुपये में) कितनी है?'
      },
      helper: {
        en: 'e.g., 50000, 100000, 180000',
        ta: 'எ.கா., 50000, 100000, 180000',
        hi: 'उदा. 50000, 100000, 180000'
      },
      placeholder: {
        en: 'e.g., 120000',
        ta: 'எ.கா., 120000',
        hi: 'उदा. 120000'
      }
    },
    {
      id: 'community',
      type: 'options',
      prompt: {
        en: 'What is your community / caste category?',
        ta: 'உங்கள் சமூகம் / சாதி வகை என்ன?',
        hi: 'आपकी सामुदायिक / जाति श्रेणी क्या है?'
      },
      options: [
        { value: 'SC', label: { en: 'SC (Scheduled Caste)', ta: 'SC (ஆதி திராவிடர்)', hi: 'SC (अनुसूचित जाति)' } },
        { value: 'ST', label: { en: 'ST (Scheduled Tribe)', ta: 'ST (பழங்குடியினர்)', hi: 'ST (अनुसूचित जनजाति)' } },
        { value: 'MBC', label: { en: 'MBC (Most Backward Class)', ta: 'MBC (மிகவும் பிற்படுத்தப்பட்டோர்)', hi: 'MBC (अत्यंत पिछड़ा वर्ग)' } },
        { value: 'BC', label: { en: 'BC (Backward Class)', ta: 'BC (பிற்படுத்தப்பட்டோர்)', hi: 'BC (पिछड़ा वर्ग)' } },
        { value: 'General', label: { en: 'General / OC', ta: 'பொது / OC', hi: 'सामान्य / OC' } }
      ]
    },
    {
      id: 'rationCardType',
      type: 'options',
      prompt: {
        en: 'What type of Ration Card do you have?',
        ta: 'உங்களிடம் என்ன வகையான ரேஷன் கார்டு உள்ளது?',
        hi: 'आपके पास किस प्रकार का राशन कार्ड है?'
      },
      options: [
        { value: 'PHH', label: { en: 'PHH (Priority Household)', ta: 'PHH (முன்னுரிமை குடும்பம்)', hi: 'PHH (प्राथमिकता परिवार)' } },
        { value: 'NPHH', label: { en: 'NPHH (Non-Priority)', ta: 'NPHH (முன்னுரிமையற்றது)', hi: 'NPHH (गैर-प्राथमिकता)' } },
        { value: 'AAY', label: { en: 'AAY (Antyodaya)', ta: 'AAY (அந்தியோதயா)', hi: 'AAY (अंत्योदय)' } },
        { value: 'none', label: { en: 'No Ration Card', ta: 'ரேஷன் கார்டு இல்லை', hi: 'कोई राशन कार्ड नहीं' } }
      ]
    },
    {
      id: 'knowsTailoring',
      type: 'yesno',
      prompt: {
        en: 'Do you know tailoring / stitching?',
        ta: 'உங்களுக்கு தையல் கலை / தைக்கத் தெரியுமா?',
        hi: 'क्या आप सिलाई / कढ़ाई जानते हैं?'
      }
    },
    {
      id: 'isFarmer',
      type: 'yesno',
      prompt: {
        en: 'Do you work in farming / agriculture?',
        ta: 'நீங்கள் விவசாயம் அல்லது அது சார்ந்த பணிகளில் ஈடுபடுகிறீர்களா?',
        hi: 'क्या आप खेती या कृषि क्षेत्र में काम करते हैं?'
      }
    },
    {
      id: 'ownsLand',
      type: 'yesno',
      condition: (answers) => answers.isFarmer === true,
      prompt: {
        en: 'Do you own farming land?',
        ta: 'உங்களுக்கு சொந்தமாக விவசாய நிலம் உள்ளதா?',
        hi: 'क्या आपके पास अपनी कृषि भूमि है?'
      }
    },
    {
      id: 'isDailyWage',
      type: 'yesno',
      prompt: {
        en: 'Are you a daily-wage or unorganized sector worker?',
        ta: 'நீங்கள் தினக்கூலி அல்லது அமைப்புசாரா தொழிலாளரா?',
        hi: 'क्या आप दिहाड़ी मजदूर या असंगठित क्षेत्र के श्रमिक हैं?'
      }
    },
    {
      id: 'hasSchoolChildren',
      type: 'yesno',
      prompt: {
        en: 'Do you have children going to school?',
        ta: 'உங்களுக்கு பள்ளி செல்லும் குழந்தைகள் உள்ளனரா?',
        hi: 'क्या आपके बच्चे स्कूल जाते हैं?'
      }
    },
    {
      id: 'hadAccident',
      type: 'yesno',
      prompt: {
        en: 'Have you had an accident recently?',
        ta: 'சமீபத்தில் விபத்து ஏதும் ஏற்பட்டுள்ளதா?',
        hi: 'क्या हाल ही में आपके साथ कोई दुर्घटना हुई है?'
      }
    },
    {
      id: 'accidentHoursAgo',
      type: 'number',
      condition: (answers) => answers.hadAccident === true,
      simulatedVoice: '12',
      prompt: {
        en: 'How many hours ago was the accident?',
        ta: 'விபத்து நடந்து எத்தனை மணி நேரங்கள் ஆகிறது?',
        hi: 'दुर्घटना कितने घंटे पहले हुई थी?'
      },
      helper: {
        en: 'Emergency schemes require reporting within 48 hours',
        ta: 'அவசர சிகிச்சை திட்டங்களுக்கு 48 மணி நேரத்திற்குள் தெரிவிக்க வேண்டும்',
        hi: 'आपातकालीन योजनाओं के लिए 48 घंटों के भीतर रिपोर्ट करना आवश्यक है'
      },
      placeholder: {
        en: 'e.g., 12',
        ta: 'எ.கா., 12',
        hi: 'उदा. 12'
      }
    },
    {
      id: 'lifeEvent',
      type: 'options',
      prompt: {
        en: 'Has any major life event happened recently?',
        ta: 'சமீபத்தில் ஏதேனும் முக்கிய வாழ்க்கை நிகழ்வு நடந்ததா?',
        hi: 'क्या हाल ही में कोई बड़ी जीवन घटना हुई है?'
      },
      options: [
        { value: 'job_loss', label: { en: 'Job Loss / Income Halt', ta: 'வேலை இழப்பு / வருமான நிறுத்தம்', hi: 'नौकरी छूटना / आय रुकना' }, icon: 'work_off' },
        { value: 'birth_of_child', label: { en: 'Birth of a Child', ta: 'குழந்தை பிறப்பு', hi: 'बच्चे का जन्म' }, icon: 'child_care' },
        { value: 'breadwinner_demise', label: { en: 'Demise of Primary Breadwinner', ta: 'குடும்ப முதன்மை வருமானதாரர் மரணம்', hi: 'मुख्य कमाने वाले की मृत्यु' }, icon: 'sentiment_very_dissatisfied' },
        { value: 'none', label: { en: 'None', ta: 'எதுவுமில்லை', hi: 'कोई नहीं' }, icon: 'check_circle' }
      ]
    },
    {
      id: 'district',
      type: 'options',
      prompt: {
        en: 'Which district do you live in?',
        ta: 'நீங்கள் எந்த மாவட்டத்தில் வசிக்கிறீர்கள்?',
        hi: 'आप किस जिले में रहते हैं?'
      },
      options: [
        { value: 'Chennai', label: { en: 'Chennai', ta: 'சென்னை', hi: 'चेन्नई' } },
        { value: 'Coimbatore', label: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்', hi: 'कोयंबटूर' } },
        { value: 'Madurai', label: { en: 'Madurai', ta: 'மதுரை', hi: 'मदुरई' } },
        { value: 'Salem', label: { en: 'Salem', ta: 'சேலம்', hi: 'सलेम' } },
        { value: 'Tiruchirappalli', label: { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி', hi: 'तिरुचिरापल्ली' } },
        { value: 'Tirunelveli', label: { en: 'Tirunelveli', ta: 'திருநெல்வேலி', hi: 'तिरुनेलवेली' } },
        { value: 'Erode', label: { en: 'Erode', ta: 'ஈரோடு', hi: 'इरोड' } },
        { value: 'Thanjavur', label: { en: 'Thanjavur', ta: 'தஞ்சாவூர்', hi: 'तंजावुर' } }
      ]
    },
    {
      id: 'taluk',
      type: 'dynamic_options',
      condition: (answers) => !!answers.district,
      prompt: {
        en: 'Which taluk / area?',
        ta: 'எந்த தாலுகா / பகுதி?',
        hi: 'कौन सा तालुक / क्षेत्र?'
      },
      getOptions: (answers) => {
        const taluks = getTaluksByDistrict(answers.district) || [];
        return taluks.map(t => ({
          value: t.name,
          label: { en: t.name, ta: t.name, hi: t.name }
        }));
      }
    },
    {
      id: 'documentsReady',
      type: 'multiselect',
      prompt: {
        en: 'Which documents do you have ready?',
        ta: 'உங்களிடம் தற்போது தயாராக உள்ள ஆவணங்கள் எவை?',
        hi: 'आपके पास कौन से दस्तावेज़ तैयार हैं?'
      },
      options: [
        'Aadhar',
        'Bank Passbook',
        'Transfer Certificate',
        'Income Certificate',
        'Hospital Report',
        'Welfare Board Card',
        'Student ID'
      ]
    },
    {
      id: 'incomeCertAmount',
      type: 'number',
      condition: (answers) => (answers.documentsReady || []).includes('Income Certificate'),
      simulatedVoice: '120000',
      prompt: {
        en: 'What amount is shown on your Income Certificate?',
        ta: 'உங்கள் வருமானச் சான்றிதழில் எவ்வளவு தொகை காட்டப்பட்டுள்ளது?',
        hi: 'आपके आय प्रमाणपत्र में कितनी राशि दर्शाई गई है?'
      },
      placeholder: { en: 'e.g., 120000', ta: 'எ.கா., 120000', hi: 'उदा. 120000' }
    },
    {
      id: 'aadhaarLinked',
      type: 'yesno',
      condition: (answers) => (answers.documentsReady || []).includes('Aadhar'),
      prompt: {
        en: 'Is your Aadhaar linked to your bank account?',
        ta: 'உங்கள் ஆதார் வங்கிக் கணக்குடன் இணைக்கப்பட்டுள்ளதா?',
        hi: 'क्या आपका आधार बैंक खाते से जुड़ा है?'
      }
    },
    {
      id: 'nameOnAadhaar',
      type: 'text',
      condition: (answers) => (answers.documentsReady || []).includes('Aadhar'),
      simulatedVoice: 'Surya K',
      prompt: {
        en: 'What is the exact name printed on your Aadhaar card?',
        ta: 'உங்கள் ஆதார் அட்டையில் அச்சிடப்பட்ட சரியான பெயர் என்ன?',
        hi: 'आपके आधार कार्ड पर छपा सही नाम क्या है?'
      },
      placeholder: { en: 'e.g., Surya Kumar', ta: 'எ.கா., சூர்யா குமார்', hi: 'उदा. सूर्या कुमार' }
    }
  ];

  // State
  const [answers, setAnswers] = useState(() => ({
    name: userData?.name || '',
    age: userData?.age || '',
    gender: userData?.gender || '',
    education: userData?.education || '',
    income: userData?.income || '',
    community: userData?.community || '',
    rationCardType: userData?.rationCardType || '',
    knowsTailoring: userData?.knowsTailoring ?? null,
    isFarmer: userData?.isFarmer ?? null,
    ownsLand: userData?.ownsLand ?? null,
    isDailyWage: userData?.isDailyWage ?? null,
    hasSchoolChildren: userData?.hasSchoolChildren ?? null,
    hadAccident: userData?.hadAccident ?? null,
    accidentHoursAgo: userData?.accidentHoursAgo || '',
    lifeEvent: userData?.lifeEvent || 'none',
    district: userData?.district || '',
    taluk: userData?.taluk || '',
    documentsReady: userData?.documentsReady || [],
    incomeCertAmount: userData?.incomeCertAmount || '',
    aadhaarLinked: userData?.aadhaarLinked ?? null,
    nameOnAadhaar: userData?.nameOnAadhaar || ''
  }));

  // Filter active questions based on current answers
  const activeQuestions = rawQuestions.filter(q => !q.condition || q.condition(answers));

  // Determine current active question index
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [selectedDocs, setSelectedDocs] = useState(answers.documentsReady || []);
  const [chatHistory, setChatHistory] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savePhone, setSavePhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, currentStepIndex]);

  // Initial greeting and first question
  useEffect(() => {
    if (activeQuestions.length > 0 && chatHistory.length === 0) {
      const firstQ = activeQuestions[0];
      const botMsg = {
        sender: 'bot',
        text: firstQ.prompt[language] || firstQ.prompt.en,
        questionId: firstQ.id,
        helper: firstQ.helper ? (firstQ.helper[language] || firstQ.helper.en) : null
      };
      setChatHistory([botMsg]);
    }
  }, [language]);

  const currentQ = activeQuestions[currentStepIndex];

  // Helper to format user response for bubble
  const formatUserAnswer = (q, val) => {
    if (!q) return String(val);
    if (q.type === 'yesno') {
      if (val === true) return language === 'ta' ? 'ஆம் (Yes)' : language === 'hi' ? 'हाँ (Yes)' : 'Yes';
      return language === 'ta' ? 'இல்லை (No)' : language === 'hi' ? 'नहीं (No)' : 'No';
    }
    if (q.type === 'options') {
      const opt = q.options?.find(o => o.value === val);
      return opt ? (opt.label[language] || opt.label.en) : val;
    }
    if (q.type === 'dynamic_options') {
      const opts = typeof q.getOptions === 'function' ? q.getOptions(answers) : [];
      const opt = opts.find(o => o.value === val);
      return opt ? (opt.label?.[language] || opt.label?.en || opt.value) : val;
    }
    if (q.type === 'multiselect') {
      return Array.isArray(val) && val.length > 0
        ? val.join(', ')
        : (language === 'ta' ? 'ஆவணங்கள் எதுவும் இல்லை' : language === 'hi' ? 'कोई दस्तावेज़ नहीं' : 'None yet');
    }
    return String(val);
  };

  const handleNextQuestion = (nextAnswers, currentAnswerVal) => {
    // Record user answer in chat history
    const userMsg = {
      sender: 'user',
      text: formatUserAnswer(currentQ, currentAnswerVal)
    };

    // Calculate new active questions after answer update
    const updatedActiveQuestions = rawQuestions.filter(q => !q.condition || q.condition(nextAnswers));
    const nextIdx = currentStepIndex + 1;

    if (nextIdx < updatedActiveQuestions.length) {
      const nextQ = updatedActiveQuestions[nextIdx];
      const botMsg = {
        sender: 'bot',
        text: nextQ.prompt[language] || nextQ.prompt.en,
        questionId: nextQ.id,
        helper: nextQ.helper ? (nextQ.helper[language] || nextQ.helper.en) : null
      };
      setChatHistory(prev => [...prev, userMsg, botMsg]);
      setCurrentStepIndex(nextIdx);
      setInputValue('');
    } else {
      // Completed all questions! Run evaluation
      setChatHistory(prev => [...prev, userMsg]);
      completeIntake(nextAnswers);
    }
  };

  const submitTextAnswer = (valToSubmit) => {
    const val = (valToSubmit !== undefined ? valToSubmit : inputValue).trim();
    if (!val) return;

    let parsedVal = val;
    if (currentQ.type === 'number') {
      parsedVal = Number(val);
      if (isNaN(parsedVal)) return;
    }

    const nextAnswers = {
      ...answers,
      [currentQ.id]: parsedVal
    };

    setAnswers(nextAnswers);
    handleNextQuestion(nextAnswers, parsedVal);
  };

  const handleChoiceSelect = (choiceVal) => {
    const nextAnswers = {
      ...answers,
      [currentQ.id]: choiceVal
    };
    setAnswers(nextAnswers);
    handleNextQuestion(nextAnswers, choiceVal);
  };

  const toggleDocSelection = (docName) => {
    setSelectedDocs(prev => {
      if (prev.includes(docName)) {
        return prev.filter(d => d !== docName);
      } else {
        return [...prev, docName];
      }
    });
  };

  const submitMultiselect = () => {
    const nextAnswers = {
      ...answers,
      documentsReady: selectedDocs
    };
    setAnswers(nextAnswers);
    handleNextQuestion(nextAnswers, selectedDocs);
  };

  const handleBack = () => {
    if (currentStepIndex <= 0) {
      navigate('/');
      return;
    }
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);

    // Prune chat history back to the previous question
    const targetQ = activeQuestions[prevIdx];
    const botIdx = chatHistory.findIndex(m => m.sender === 'bot' && m.questionId === targetQ.id);
    if (botIdx !== -1) {
      setChatHistory(chatHistory.slice(0, botIdx + 1));
    }
  };

  const completeIntake = (finalAnswers) => {
    setIsSubmitting(true);

    const compiledData = {
      ...userData,
      name: finalAnswers.name || 'Citizen',
      age: Number(finalAnswers.age) || 0,
      gender: finalAnswers.gender || '',
      // Education — camelCase + snake_case for rules engine
      education: Number(finalAnswers.education) || 0,
      educationLevel: Number(finalAnswers.education) || 0,
      education_level: Number(finalAnswers.education) || 0,
      // Income — camelCase + snake_case for rules engine
      income: Number(finalAnswers.income) || 0,
      annualIncome: Number(finalAnswers.income) || 0,
      annual_income: Number(finalAnswers.income) || 0,
      // Tailoring
      knowsTailoring: !!finalAnswers.knowsTailoring,
      knows_tailoring: !!finalAnswers.knowsTailoring,
      tailoring: !!finalAnswers.knowsTailoring,
      // Agriculture
      isFarmer: !!finalAnswers.isFarmer,
      works_in_agriculture: !!finalAnswers.isFarmer,
      farming: !!finalAnswers.isFarmer,
      // Land ownership
      ownsLand: finalAnswers.isFarmer ? !!finalAnswers.ownsLand : false,
      owns_agricultural_land: finalAnswers.isFarmer ? !!finalAnswers.ownsLand : false,
      ownsFarmingLand: finalAnswers.isFarmer ? !!finalAnswers.ownsLand : false,
      // Unorganized worker
      isDailyWage: !!finalAnswers.isDailyWage,
      is_unorganized_worker: !!finalAnswers.isDailyWage,
      unorganizedWorker: !!finalAnswers.isDailyWage,
      dailyWage: !!finalAnswers.isDailyWage,
      // School children
      hasSchoolChildren: !!finalAnswers.hasSchoolChildren,
      has_school_kids: !!finalAnswers.hasSchoolChildren,
      schoolChildren: !!finalAnswers.hasSchoolChildren,
      // Accident
      hadAccident: !!finalAnswers.hadAccident,
      recentAccident: !!finalAnswers.hadAccident,
      accidentHoursAgo: finalAnswers.hadAccident ? Number(finalAnswers.accidentHoursAgo) : null,
      accident_hours_ago: finalAnswers.hadAccident ? Number(finalAnswers.accidentHoursAgo) : null,
      accidentHours: finalAnswers.hadAccident ? Number(finalAnswers.accidentHoursAgo) : null,
      // Documents — both key names
      documentsReady: finalAnswers.documentsReady || [],
      uploaded_documents: finalAnswers.documentsReady || [],
      uploadedDocs: finalAnswers.documentsReady || [],
      // New 4-pillar fields
      community: finalAnswers.community || '',
      rationCardType: finalAnswers.rationCardType || '',
      district: finalAnswers.district || '',
      taluk: finalAnswers.taluk || '',
      lifeEvent: finalAnswers.lifeEvent || 'none',
      aadhaarLinked: !!finalAnswers.aadhaarLinked,
      incomeCertAmount: finalAnswers.incomeCertAmount ? Number(finalAnswers.incomeCertAmount) : null,
      nameOnAadhaar: finalAnswers.nameOnAadhaar || '',
      nameOnRationCard: finalAnswers.nameOnRationCard || '',
      documentMetadata: {
        aadhaar: (finalAnswers.documentsReady || []).includes('Aadhar') ? {
          name: finalAnswers.nameOnAadhaar || finalAnswers.name || '',
          linkedToBank: !!finalAnswers.aadhaarLinked
        } : null,
        incomeCertificate: (finalAnswers.documentsReady || []).includes('Income Certificate') ? {
          amount: finalAnswers.incomeCertAmount ? Number(finalAnswers.incomeCertAmount) : null,
          issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        } : null,
        rationCard: finalAnswers.rationCardType && finalAnswers.rationCardType !== 'none' ? {
          type: finalAnswers.rationCardType,
          name: finalAnswers.name || '',
          familySize: 4
        } : null
      },
      trackingStatus: 'data_collected'
    };

    if (updateUserData) {
      updateUserData(compiledData);
    }

    try {
      let results = [];
      if (typeof evaluateAllSchemes === 'function') {
        results = evaluateAllSchemes(compiledData);
      }
      if (setResults) {
        setResults(results);
      }

      // Run Pillar 2 & Pillar 3 engines
      const valResults = typeof runFullValidation === 'function'
        ? runFullValidation(compiledData, compiledData.documentMetadata)
        : null;
      const riskAss = typeof runFullRiskAssessment === 'function'
        ? runFullRiskAssessment(compiledData, compiledData.documentMetadata)
        : null;

      if (setValidationResults && valResults) setValidationResults(valResults);
      if (setRiskAssessment && riskAss) setRiskAssessment(riskAss);
      if (setTrackingStatus) setTrackingStatus('validation_passed');

      if (addToast) {
        addToast(
          language === 'ta'
            ? 'தகுதி மதிப்பீடு முடிந்தது!'
            : language === 'hi'
            ? 'पात्रता मूल्यांकन पूर्ण हुआ!'
            : 'Eligibility evaluation complete!',
          'success'
        );
      }
      navigate('/results');
    } catch (err) {
      console.error('Error evaluating schemes:', err);
      navigate('/results');
    }
  };

  const handleSaveProgress = (e) => {
    e.preventDefault();
    const phone = savePhone.trim();
    if (!phone || phone.length < 10) {
      if (addToast) {
        addToast(t('enterValidPhone', 'Please enter a valid 10-digit mobile number'), 'error');
      }
      return;
    }

    const payload = {
      ...userData,
      ...answers,
      currentStep: currentStepIndex
    };

    if (saveSession) {
      saveSession(phone, payload);
    } else {
      localStorage.setItem(`rightaid_session_${phone}`, JSON.stringify(payload));
    }

    if (addToast) {
      addToast(
        language === 'ta'
          ? 'உங்கள் விவரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!'
          : language === 'hi'
          ? 'आपकी प्रगति सफलतापूर्वक सहेजी गई!'
          : 'Progress saved successfully!',
        'success'
      );
    }
    setShowSaveModal(false);
  };

  const progressPercentage = Math.round(((currentStepIndex + 1) / activeQuestions.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* Top Header Bar */}
      <header
        style={{
          backgroundColor: '#1e3a8a',
          color: '#ffffff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label="Previous step"
          >
            <span className="material-icons" style={{ fontSize: '24px' }}>arrow_back</span>
          </button>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>
              {t('chatIntakeTitle', 'RightAid Scheme Assistant')}
            </div>
            <div style={{ fontSize: '11px', color: '#93c5fd' }}>
              {t('stepIndicator', 'Question')} {currentStepIndex + 1} of {activeQuestions.length}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSaveModal(true)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>save</span>
          <span>{t('saveProgress', 'Save Progress')}</span>
        </button>
      </header>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '5px', backgroundColor: '#cbd5e1' }}>
        <div
          className="progress-bar"
          style={{
            width: `${progressPercentage}%`,
            height: '100%',
            backgroundColor: '#ea580c',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Chat Messages Scroll Container */}
      <div
        className="chat-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {chatHistory.map((msg, index) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: isBot ? 'flex-start' : 'flex-end',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              {isBot && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '20px' }}>smart_toy</span>
                </div>
              )}

              <div
                className={`chat-bubble ${isBot ? 'chat-bubble-bot' : 'chat-bubble-user'}`}
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  backgroundColor: isBot ? '#ffffff' : '#1e3a8a',
                  color: isBot ? '#1f2937' : '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  border: isBot ? '1px solid #e2e8f0' : 'none',
                  fontSize: '15px',
                  lineHeight: '1.45',
                  wordBreak: 'break-word'
                }}
              >
                <div>{msg.text}</div>
                {msg.helper && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: isBot ? '#64748b' : '#cbd5e1',
                      marginTop: '6px',
                      borderTop: '1px dashed #e2e8f0',
                      paddingTop: '4px'
                    }}
                  >
                    {msg.helper}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSubmitting && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 24px',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              <span className="material-icons" style={{ animation: 'spin 1s linear infinite', color: '#ea580c' }}>
                sync
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                {t('evaluatingSchemes', 'Matching your profile with all state & central schemes...')}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Area at Bottom */}
      {!isSubmitting && currentQ && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {/* Case 1: Yes / No buttons */}
            {currentQ.type === 'yesno' && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleChoiceSelect(true)}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '17px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  <span className="material-icons">check_circle</span>
                  <span>{language === 'ta' ? 'ஆம் (Yes)' : language === 'hi' ? 'हाँ (Yes)' : 'Yes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChoiceSelect(false)}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '17px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <span className="material-icons">cancel</span>
                  <span>{language === 'ta' ? 'இல்லை (No)' : language === 'hi' ? 'नहीं (No)' : 'No'}</span>
                </button>
              </div>
            )}

            {/* Case 2: Static Multiple Options buttons */}
            {currentQ.type === 'options' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {currentQ.options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChoiceSelect(opt.value)}
                    className="btn-secondary"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      border: '2px solid #cbd5e1',
                      color: '#1e293b',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {opt.icon && <span className="material-icons">{opt.icon}</span>}
                    <span>{opt.label[language] || opt.label.en}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Case 2b: Dynamic Options buttons (e.g., Taluks by District) */}
            {currentQ.type === 'dynamic_options' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {(typeof currentQ.getOptions === 'function' ? currentQ.getOptions(answers) : []).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChoiceSelect(opt.value)}
                    className="btn-secondary"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      border: '2px solid #cbd5e1',
                      color: '#1e293b',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '20px', color: '#003366' }}>location_city</span>
                    <span>{opt.label?.[language] || opt.label?.en || opt.value}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Case 3: Document Checklist Multiselect */}
            {currentQ.type === 'multiselect' && (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '10px',
                    maxHeight: '230px',
                    overflowY: 'auto',
                    marginBottom: '14px',
                    padding: '4px'
                  }}
                >
                  {currentQ.options.map(doc => {
                    const isChecked = selectedDocs.includes(doc);
                    return (
                      <label
                        key={doc}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: isChecked ? '#eff6ff' : '#f8fafc',
                          border: isChecked ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                          cursor: 'pointer',
                          userSelect: 'none',
                          fontSize: '14px',
                          fontWeight: isChecked ? '700' : '500',
                          color: '#1e293b'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDocSelection(doc)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>{doc}</span>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={submitMultiselect}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '17px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
                  }}
                >
                  <span className="material-icons">arrow_forward</span>
                  <span>
                    {language === 'ta'
                      ? 'ஆவணங்களை உறுதிசெய்து தொடரவும்'
                      : language === 'hi'
                      ? 'दस्तावेज़ की पुष्टि करें और आगे बढ़ें'
                      : 'Confirm Documents & Continue'}
                  </span>
                </button>
              </div>
            )}

            {/* Case 4: Text / Number inputs with VoiceButton */}
            {(currentQ.type === 'text' || currentQ.type === 'number') && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitTextAnswer();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type={currentQ.type === 'number' ? 'number' : 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      currentQ.placeholder
                        ? currentQ.placeholder[language] || currentQ.placeholder.en
                        : ''
                    }
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '24px',
                      border: '2px solid #cbd5e1',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                </div>

                {/* Voice Simulation Button */}
                {currentQ.simulatedVoice && (
                  <VoiceButton
                    simulatedText={currentQ.simulatedVoice}
                    onResult={(spokenText) => {
                      setInputValue(spokenText);
                      submitTextAnswer(spokenText);
                    }}
                  />
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="btn-primary"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: inputValue.trim() ? '#1e3a8a' : '#cbd5e1',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  aria-label="Send answer"
                >
                  <span className="material-icons" style={{ fontSize: '20px' }}>send</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Save Progress Modal */}
      {showSaveModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                {t('saveSessionTitle', 'Save Your Application Progress')}
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              {t(
                'savePhoneDesc',
                'Enter your 10-digit mobile number. You can resume your application anytime from the home page.'
              )}
            </p>

            <form onSubmit={handleSaveProgress}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="tel"
                  maxLength={10}
                  value={savePhone}
                  onChange={(e) => setSavePhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="btn-secondary"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t('saveNow', 'Save Progress')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating SOS Button */}
      <SOSButton />
    </div>
  );
}
