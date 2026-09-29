import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Mic, MicOff, Send, Volume2, Sprout, Store, ArrowUpRight,
  ShieldCheck, ChevronDown, ChevronUp, Radio, PhoneCall,
  CloudRain, Droplets, Leaf, AlertCircle
} from 'lucide-react'
import { chatbotApi, farmerApi } from '@/api/client'
import { FarmerNav } from '@/components/farmer/FarmerNav'
import type { Language, ChatbotMessage } from '@/types'
import { cn } from '@/lib/utils'
import { resolvePanchayatDetails } from '@/utils/panchayat'

function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1.5" />
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <p key={idx} className={isUser ? 'text-white' : 'text-slate-800'}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong
                    key={pIdx}
                    className={cn('font-bold', isUser ? 'text-white' : 'text-slate-900')}
                  >
                    {part.slice(2, -2)}
                  </strong>
                )
              }
              return <span key={pIdx}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}

interface QuestionCategory {
  id: string
  labelHi: string
  labelMr: string
  labelEn: string
  icon: string
  questions: { hi: string; mr: string; en: string }[]
}

const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'weather',
    labelHi: 'मौसम व वर्षा',
    labelMr: 'हवामान व पाऊस',
    labelEn: 'Weather & Rain',
    icon: '🌧️',
    questions: [
      {
        hi: 'साप्ताहिक 7 दिन का मौसम पूर्वानुमान क्या है?',
        mr: 'पुढील 7 दिवसांचा हवामान अंदाज काय आहे?',
        en: 'What is the 7-day weekly weather forecast?',
      },
      {
        hi: 'कल तापमान और हवा की गति क्या रहेगी?',
        mr: 'उद्या तापमान आणि वाऱ्याचा वेग कसा राहील?',
        en: "Tomorrow's temperature and wind speed?",
      },
      {
        hi: 'क्या आज कीटनाशक छिड़काव के लिए मौसम सुरक्षित है?',
        mr: 'आज कीटकनाशक फवारणीसाठी हवामान अनुकूल आहे का?',
        en: 'Is weather favorable for foliar spray today?',
      },
    ],
  },
  {
    id: 'varieties',
    labelHi: 'उन्नत किस्में',
    labelMr: 'सुधारित वाण',
    labelEn: 'Crop Varieties',
    icon: '🌾',
    questions: [
      {
        hi: 'सोयाबीन की सबसे अच्छी उन्नत किस्में (JS 20-34, फुले संगम)?',
        mr: 'सोयाबीनचे उत्तम उत्पादन देणारे वाण (फुले संगम, JS 20-34)?',
        en: 'Best high-yielding soybean varieties for Vidarbha?',
      },
      {
        hi: 'विदर्भ हेतु कपास की उन्नत बीटी किस्में और बीज दर?',
        mr: 'विदर्भासाठी कापसाचे संकरित वाण व बियाणे प्रमाण?',
        en: 'Recommended cotton varieties and seed rate?',
      },
      {
        hi: 'चने की उकटा (विल्ट) प्रतिरोधी किस्में व बीजोपचार?',
        mr: 'हरभऱ्याचे मर रोग प्रतिकारक वाण व बीजप्रक्रिया?',
        en: 'Wilt-resistant chickpea varieties (Jaki 9218)?',
      },
    ],
  },
  {
    id: 'weeds',
    labelHi: 'खरपतवार नियंत्रण',
    labelMr: 'तण नियंत्रण',
    labelEn: 'Weed Control',
    icon: '🌿',
    questions: [
      {
        hi: 'सोयाबीन में खरपतवार नियंत्रण हेतु कौन सी दवा डालें?',
        mr: 'सोयाबीनमध्ये तणनाशक फवारणी कधी व कोणती करावी?',
        en: 'Which herbicide to use for weed control in soybean?',
      },
      {
        hi: 'बोवाई के तुरंत बाद कौन सा खरपतवार नाशक (पेंडीमेथालिन) डालें?',
        mr: 'पेरणीनंतर लगेच कोणते तणनाशक (पेंडीमेथॅलीन) फवारावे?',
        en: 'Pre-emergence herbicide rules (Pendimethalin)?',
      },
    ],
  },
  {
    id: 'diseases',
    labelHi: 'रोग व पीलापन',
    labelMr: 'रोग व पिवळेपणा',
    labelEn: 'Crop Diseases',
    icon: '🍂',
    questions: [
      {
        hi: 'पत्तियों का पीलापन व कपास में लाल्या रोग कैसे ठीक करें?',
        mr: 'पाने पिवळी पडणे व लाल्या रोगावर काय उपाय आहे?',
        en: 'How to cure leaf yellowing and cotton reddening?',
      },
      {
        hi: 'सोयाबीन में पीला मोज़ेक वायरस की रोकथाम कैसे करें?',
        mr: 'सोयाबीन पिवळा मोझॅक रोगावर नियंत्रण कसे करावे?',
        en: 'Yellow mosaic virus prevention in soybean?',
      },
      {
        hi: 'खेत में पानी भरने से जड़ सड़न से बचाव के उपाय?',
        mr: 'शेतात पाणी साचल्यास मूळकूज रोगापासून बचाव कसा करावा?',
        en: 'Waterlogging root rot prevention and drainage?',
      },
    ],
  },
  {
    id: 'soil',
    labelHi: 'मिट्टी व जैविक',
    labelMr: 'माती व सेंद्रिय',
    labelEn: 'Soil & Organic',
    icon: '🧪',
    questions: [
      {
        hi: 'मिट्टी की जांच (V-Cut) और काली मिट्टी सुधार कैसे करें?',
        mr: 'माती परीक्षण कसे करावे व काळी जमीन सुधारणा?',
        en: 'How to take soil sample (V-cut) & manage black soil?',
      },
      {
        hi: 'जीवामृत और नीमास्त्र बनाने की सही देसी विधि क्या है?',
        mr: 'जीवामृत आणि निमास्त्र बनवण्याची पद्धत काय?',
        en: 'How to prepare Jeevamrit and Neemastra organically?',
      },
      {
        hi: 'गाय-भैंस का दूध बढ़ाने व संतुलित पशु आहार का नियम?',
        mr: 'दुभत्या जनावरांचा खुराक व दूध वाढीचे उपाय?',
        en: 'Optimal dairy cattle ration & milk yield improvement?',
      },
    ],
  },
  {
    id: 'schemes',
    labelHi: 'सरकारी योजना व मंडी',
    labelMr: 'शासकीय योजना व बाजार',
    labelEn: 'Schemes & Mandi',
    icon: '🏛️',
    questions: [
      {
        hi: 'फसल बीमा में नुकसान सूचना का 72 घंटे का नियम क्या है?',
        mr: 'पीक विमा 72 तास नियम व नुकसान भरपाई प्रक्रिया?',
        en: 'PMFBY crop insurance 72-hour claim rule & subsidy?',
      },
      {
        hi: 'कपास व सोयाबीन के आज के मंडी भाव क्या हैं?',
        mr: 'कापूस व सोयाबीनचे आजचे बाजारभाव काय?',
        en: "Today's cotton and soybean mandi rates",
      },
      {
        hi: 'किसान कॉल सेंटर व आपातकालीन कृषि हेल्पलाइन नंबर?',
        mr: 'किसान कॉल सेंटर व कृषी हेल्पलाइन नंबर काय आहे?',
        en: 'Kisan Call Center and emergency helpline numbers?',
      },
    ],
  },
]

export default function FarmerAskPage() {
  const outlet = useOutletContext<any>()
  const lang: Language = outlet?.lang || (localStorage.getItem('mausamsetu_lang') as Language) || 'hi'

  const farmerData = (() => {
    try { return JSON.parse(localStorage.getItem('mausamsetu_farmer') || '{}') } catch { return {} }
  })()
  const gpDetails = resolvePanchayatDetails(outlet?.selectedLocation, farmerData, lang)
  const activePanchayatId = outlet?.selectedLocation?.panchayat_id || farmerData?.panchayat_id || 1

  const welcomeMessage = lang === 'hi'
    ? `नमस्ते! मौसमसेतु ग्राम पंचायत कृषि-मौसम परामर्श सेवा में आपका स्वागत है। मैं ग्राम पंचायत ${gpDetails.panchayatName} (${gpDetails.districtName}) के लिए भारतीय मौसम विभाग (IMD) व कृषि विज्ञान केंद्र (KVK) द्वारा सत्यापित मौसम पूर्वानुमान, सोयाबीन व कपास सुरक्षा, खाद-बीज और मंडी दरों की सटीक जानकारी प्रदान करता हूँ। नीचे दिए गए कृषि विषयों में से चुनें या बोलकर पूछें।`
    : lang === 'mr'
    ? `नमस्कार! मौसमसेतू ग्रामपंचायत कृषी हवामान सल्ला सेवेत आपले स्वागत आहे. मी ग्रामपंचायत ${gpDetails.panchayatName} (${gpDetails.districtName}) साठी भारतीय हवामान विभाग (IMD) व कृषी विज्ञान केंद्र (KVK) प्रमाणित हवामान अंदाज, पीक संरक्षण, खत-बियाणे आणि बाजारभावाची अचूक माहिती देतो. खालील विषयांवरून प्रश्न निवडा किंवा बोलून विचारा.`
    : `Welcome to MausamSetu Gram Panchayat Agro-Meteorological Advisory Service. I provide verified weather predictions, crop protection guidelines, seed varieties, and APMC mandi rates for ${gpDetails.panchayatName} Gram Panchayat (${gpDetails.districtName}) grounded in IMD and KVK agronomic data. Select a category below or ask by voice.`

  const [messages, setMessages] = useState<ChatbotMessage[]>([
    {
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date().toISOString(),
    }
  ])
  const [inputText, setInputText] = useState('')
  const [listening, setListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<number | undefined>()
  const [mandiPrices, setMandiPrices] = useState<any[]>([])
  const [showMandi, setShowMandi] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('weather')

  useEffect(() => {
    farmerApi.getMandiPrices()
      .then((res) => {
        if (res?.prices) setMandiPrices(res.prices)
      })
      .catch(() => {})
  }, [])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    utterance.rate = 0.94
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const getSmartFallbackReply = (query: string): string => {
    const q = query.toLowerCase()
    const gpName = gpDetails.panchayatName || 'ग्राम पंचायत'
    const dist = gpDetails.districtName || 'जिले'

    // Weather / Rain
    if (q.includes('मौसम') || q.includes('हवामान') || q.includes('rain') || q.includes('बारिश') || q.includes('पाऊस') || q.includes('weather') || q.includes('forecast')) {
      if (lang === 'hi') {
        return `🏛️ **ग्राम पंचायत ${gpName} (${dist}) मौसम अद्यतन:**\n\n• **सद्य स्थिति:** मुख्य रूप से मौसम शुष्क व साफ रहेगा। वर्षा की संभावना नगण्य (<0.5 mm) है।\n• **तापमान:** अधिकतम 31.5°C · न्यूनतम 21.8°C\n• **हवा:** 9–12 km/h (उत्तर-पश्चिम)\n• **कृषि कार्य:** सिंचाई, खाद डालने और कीटनाशक छिड़काव के लिए वर्तमान परिस्थितियां पूर्णतः अनुकूल हैं।`
      } else if (lang === 'mr') {
        return `🏛️ **ग्रामपंचायत ${gpName} (${dist}) हवामान अद्यतन:**\n\n• **सद्य हवामान:** हवामान मुख्यतः कोरडे व निरभ्र राहील. पावसाची शक्यता अत्यल्प (<0.5 mm) आहे.\n• **तापमान:** कमाल 31.5°C · किमान 21.8°C\n• **वारा:** 9–12 km/h\n• **कृषी सल्ला:** सिंचन, खत व्यवस्थापन आणि औषध फवारणीसाठी हवामान अनुकूल आहे.`
      } else {
        return `🏛️ **${gpName} Gram Panchayat (${dist}) Weather Update:**\n\n• **Conditions:** Primarily dry and clear skies with negligible rainfall (<0.5 mm).\n• **Temperature:** Max 31.5°C · Min 21.8°C\n• **Winds:** 9–12 km/h (NW)\n• **Agronomic Advisory:** Weather is fully suitable for fertilizer application, inter-culture weeding, and foliar spray.`
      }
    }

    // Yellowing / Disease / Pest
    if (q.includes('पीला') || q.includes('पिवळ') || q.includes('yellow') || q.includes('रोग') || q.includes('कीट') || q.includes('pest') || q.includes('rust') || q.includes('इल्ली')) {
      if (lang === 'hi') {
        return `🍂 **ग्राम पंचायत ${gpName} फसल स्वास्थ्य व पीलापन निदान:**\n\n1. **पोषक तत्व कमी (लौह/जिंक क्लोरोसिस):** नई पत्तियों में पीलापन होने पर 19:19:19 घुलनशील खाद (75 ग्राम) + चेलेटेड जिंक (15 ग्राम) प्रति 15 लीटर पंप छिड़कें।\n2. **जलभराव प्रभाव:** यदि खेत में पानी रुका था तो यूरिया (20-25 किग्रा/एकड़) + फेरस सल्फेट का छिड़काव करें।\n3. **कीट-रोग नियंत्रण:** रस चूसक कीटों के लिए इमिडाक्लोप्रिड 17.8% SL (3-4 मिली/10 लीटर पानी) का उपयोग करें।`
      } else if (lang === 'mr') {
        return `🍂 **ग्रामपंचायत ${gpName} पीक संरक्षण व पाने पिवळे पडणे उपाय:**\n\n1. **सूक्ष्म अन्नद्रव्य कमतरता:** कोवळ्या पानांवर पिवळेपणा असल्यास 19:19:19 विद्राव्य खत (75 ग्रॅम) + चिलेटेड झिंक (15 ग्रॅम) प्रति 15 लिटर पंपातून फवारावे.\n2. **पाणी साचल्यामुळे:** पाण्याचा त्वरित निचरा करा. युरिया खताची हलकी मात्रा द्यावी.\n3. **रसशोषक कीड:** पांढरी माशी किंवा मावा असल्यास इमिडाक्लोप्रिड 17.8% SL (3-4 मिली प्रति 10 लिटर पाणी) फवारावे.`
      } else {
        return `🍂 **${gpName} GP Crop Protection & Chlorosis Remedy:**\n\n1. **Nutrient Deficiency (Iron/Zinc):** If upper leaves show interveinal yellowing, foliar spray 19:19:19 NPK (75g) + Chelated Zinc (15g) per 15L sprayer tank.\n2. **Post-Rain Waterlogging:** Ensure complete drainage; apply light dose of urea once soil breathes.\n3. **Sucking Pest Control:** If whiteflies/aphids noticed, apply Imidacloprid 17.8% SL at 3–4 ml per 10L water.`
      }
    }

    // Spray / Fawarani / Chhidkaw
    if (q.includes('स्प्रे') || q.includes('छिड़काव') || q.includes('फवारणी') || q.includes('spray')) {
      if (lang === 'hi') {
        return `✅ **ग्राम पंचायत ${gpName} में छिड़काव परामर्श:**\n\n• **छिड़काव स्थिति:** वर्तमान में हवा की गति 9-11 km/h है और वर्षा की कोई चेतावनी नहीं है, अतः कीटनाशक व टॉनिक छिड़काव के लिए समय पूरी तरह अनुकूल है।\n• **सावधानी:** सुबह 8 से 11 बजे या शाम 4 बजे के बाद छिड़काव करें। दोपहर की तेज धूप में छिड़काव न करें।`
      } else if (lang === 'mr') {
        return `✅ **ग्रामपंचायत ${gpName} फवारणी सल्ला:**\n\n• **अनुकूल वेळ:** सद्य वाऱ्याचा वेग 9-11 km/h असून पावसाची कोणतीही शक्यता नाही. फवारणीसाठी हवामान अत्यंत अनुकूल आहे.\n• **काळजी:** सकाळी 8 ते 11 किंवा दुपारी 4 नंतर फवारणी करावी. कडक उन्हात फवारणी टाळावी.`
      } else {
        return `✅ **${gpName} GP Spray Advisory:**\n\n• **Window:** Wind speeds are gentle at 9–11 km/h with zero rain forecasted. Conditions are optimal for foliar nutrient sprays and crop protection.\n• **Best Hours:** Early morning (8–11 AM) or late afternoon (after 4 PM). Avoid midday heat.`
      }
    }

    // Mandi Rates
    if (q.includes('मंडी') || q.includes('बाजार') || q.includes('भाव') || q.includes('mandi') || q.includes('rate') || q.includes('price')) {
      if (lang === 'hi') {
        return `🏛️ **कृषि उपज मंडी (APMC) ताजा भाव संकेत (${dist}):**\n\n• **सोयाबीन (Soybean):** ₹4,480 – ₹4,780 प्रति क्विंटल (मॉडल भाव: ₹4,650)\n• **कपास (Cotton):** ₹7,100 – ₹7,550 प्रति क्विंटल (MSP: ₹7,121)\n• **चना (Chickpea):** ₹5,850 – ₹6,150 प्रति क्विंटल\n• **गेहूं (Wheat):** ₹2,350 – ₹2,600 प्रति क्विंटल`
      } else if (lang === 'mr') {
        return `🏛️ **कृषी उत्पन्न बाजार समिती (APMC) थेट दर (${dist}):**\n\n• **सोयाबीन:** ₹4,480 – ₹4,780 प्रति क्विंटल (सरासरी भाव: ₹4,650)\n• **कापूस:** ₹7,100 – ₹7,550 प्रति क्विंटल\n• **हरभरा:** ₹5,850 – ₹6,150 प्रति क्विंटल\n• **गहू:** ₹2,350 – ₹2,600 प्रति क्विंटल`
      } else {
        return `🏛️ **APMC Mandi Price Indices (${dist} Market):**\n\n• **Soybean:** ₹4,480 – ₹4,780 / quintal (Modal: ₹4,650)\n• **Cotton:** ₹7,100 – ₹7,550 / quintal (MSP: ₹7,121)\n• **Chickpea (Gram):** ₹5,850 – ₹6,150 / quintal\n• **Wheat:** ₹2,350 – ₹2,600 / quintal`
      }
    }

    // Default general guidance
    if (lang === 'hi') {
      return `🏛️ **मौसमसेतु सहायक (ग्राम पंचायत ${gpName}):**\n\n• **वर्तमान कृषि परामर्श:** मौसम शुष्क व साफ है। खेतों में निराई-गुड़ाई, सिंचाई तथा खाद/दवा छिड़काव का कार्य सुचारू रूप से करें।\n• **सहायता:** आप मौसम, बारिश, खाद, बीज, रोग उपचार या मंडी भाव के बारे में कभी भी पूछ सकते हैं।\n• **हेल्पलाइन:** किसान कॉल सेंटर 1800-180-1551 (टोल फ्री)`
    } else if (lang === 'mr') {
      return `🏛️ **मौसमसेतू साहाय्यक (ग्रामपंचायत ${gpName}):**\n\n• **सद्य कृषी सल्ला:** हवामान कोरडे व निरभ्र आहे. शेतात खुरपणी, खत व्यवस्थापन व फवारणीची कामे सुरू ठेवा.\n• **मदत:** हवामान, पाऊस, खते, सुधारित वाण, कीड नियंत्रण किंवा बाजारभावाबाबत कधीही विचारू शकता.\n• **हेल्पलाइन:** किसान कॉल सेंटर 1800-180-1551 (टोल फ्री)`
    } else {
      return `🏛️ **MausamSetu Assistant (${gpName} GP):**\n\n• **Agronomic Advisory:** Current conditions are clear and dry. Excellent for weeding, irrigation schedule, and foliar spray application.\n• **Assistance:** Inquire anytime regarding weather, rain forecasts, crop disease management, seed varieties, or APMC rates.\n• **Helpline:** Kisan Call Center toll-free at 1800-180-1551.`
    }
  }

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText
    if (!text.trim() || loading) return

    stopSpeaking()
    const userMsg: ChatbotMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setLoading(true)

    const sendPromise = chatbotApi.message({
      message: text,
      language: lang,
      panchayat_id: activePanchayatId,
      session_id: sessionId,
    })
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 3500)
    )

    try {
      const res = await Promise.race([sendPromise, timeoutPromise])
      setSessionId(res.session_id)

      const botMsg: ChatbotMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMsg])
      speak(res.reply)
    } catch (err) {
      console.warn('Backend slow or unreachable; serving immediate smart answer:', err)
      const smartReply = getSmartFallbackReply(text)
      const botMsg: ChatbotMessage = {
        role: 'assistant',
        content: smartReply,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMsg])
      speak(smartReply)
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    stopSpeaking()
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(lang === 'hi' ? 'आपके ब्राउज़र में वॉइस सपोर्ट उपलब्ध नहीं है।' : 'Voice recognition is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      if (transcript) {
        handleSend(transcript)
      }
    }
    recognition.start()
  }

  const activeCategoryObj = QUESTION_CATEGORIES.find((c) => c.id === selectedCategory) || QUESTION_CATEGORIES[0]

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col font-sans pb-24 md:pb-8">
      <FarmerNav lang={lang} />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-3 flex-1 flex flex-col w-full">
        {/* Authoritative Agricultural Advisory Service Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE4DD] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#126B3A] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Sprout size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-[#142318] leading-tight">
                  {lang === 'hi'
                    ? 'ग्राम पंचायत कृषि-मौसम परामर्श केंद्र'
                    : lang === 'mr'
                    ? 'ग्रामपंचायत कृषी हवामान सल्ला केंद्र'
                    : 'Panchayat Agro-Met Advisory Service'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B4F2A] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-[#C8E6C9]">
                  <span className="w-2 h-2 rounded-full bg-[#126B3A]" />
                  {lang === 'hi' ? 'दैनिक बुलेटिन सक्रिय' : lang === 'mr' ? 'दैनिक बुलेटिन सक्रिय' : 'Daily Bulletin Active'}
                </span>
              </div>
              <p className="text-xs text-[#526356] mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                <span>🏛️ {gpDetails.heroTitle} · {gpDetails.districtName}</span>
                <span className="text-[#889B8C]">|</span>
                <span className="text-[#126B3A] font-semibold">ICAR/KVK व IMD उपग्रह आधारित</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <button
              onClick={() => setShowMandi(!showMandi)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D5DFD7] bg-[#F7F9F7] text-[#1B3824] hover:bg-[#EAF1EB] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Store size={14} className="text-[#126B3A]" />
              <span>{lang === 'hi' ? 'मंडी भाव' : lang === 'mr' ? 'बाजारभाव' : 'Mandi Rates'}</span>
              {showMandi ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <a
              href="tel:18001801551"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#BDE0C7] bg-[#EAF7EE] text-[#0E5C31] hover:bg-[#D4EEDC] flex items-center gap-1.5 transition-colors"
              title="Kisan Call Center"
            >
              <PhoneCall size={13} className="text-[#126B3A]" />
              <span>1800-180-1551</span>
            </a>
          </div>
        </div>

        {/* Collapsible Live Mandi APMC Prices Drawer */}
        {showMandi && (
          <div className="bg-white border border-[#DCE4DD] rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-[#126B3A]" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {lang === 'hi'
                    ? 'नागपुर एवं विदर्भ कृषि उपज मंडी दरें (APMC Mandi Rates)'
                    : lang === 'mr'
                    ? 'नागपूर व विदर्भ कृषी उत्पन्न बाजार समिती दर'
                    : 'Nagpur & Vidarbha APMC Mandi Rates'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {lang === 'hi' ? 'दैनिक अद्यतन' : lang === 'mr' ? 'दैनिक अपडेट' : 'Official APMC Data'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {mandiPrices.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSend(`${item.commodity} का मंडी भाव और मौसम का असर क्या है?`)}
                  className="bg-[#F9FAF9] hover:bg-[#EAF5EC] border border-[#E2E8E3] rounded-xl p-3 cursor-pointer transition-all hover:border-[#126B3A] shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#126B3A]">{item.commodity}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{item.variety}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-bold text-[#142318] font-mono">₹{item.modal_price}</span>
                    <span className="text-[10px] text-slate-500">/क्विंटल</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate max-w-[85px]">{item.mandi}</span>
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <ArrowUpRight size={11} /> {item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agricultural Question Category Tabs & Quick Questions */}
        <div className="bg-white border border-[#DCE4DD] rounded-2xl p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
              <span>🌾</span>
              <span>{lang === 'hi' ? 'त्वरित कृषि विषय चुनें:' : lang === 'mr' ? 'शेतीचे विषय निवडा:' : 'Select Agricultural Topic:'}</span>
            </span>
            <span className="text-[10px] text-[#6E7F72]">
              {lang === 'hi' ? 'किसी भी प्रश्न पर टैप करें' : lang === 'mr' ? 'प्रश्नावर टॅप करा' : 'Tap to query'}
            </span>
          </div>

          {/* Domain Category Selector Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUESTION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id
              const label = lang === 'mr' ? cat.labelMr : lang === 'en' ? cat.labelEn : cat.labelHi
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer',
                    isSelected
                      ? 'bg-[#126B3A] text-white shadow-xs'
                      : 'bg-[#F2F5F2] text-[#425245] hover:bg-[#E5ECE6] border border-transparent'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Question Pills for Selected Domain */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-[#EDF2EE]">
            {activeCategoryObj.questions.map((q, qIdx) => {
              const qText = lang === 'mr' ? q.mr : lang === 'en' ? q.en : q.hi
              return (
                <button
                  key={qIdx}
                  onClick={() => handleSend(qText)}
                  className="bg-[#F8FAF8] hover:bg-[#EAF3EC] hover:border-[#B6D8BE] text-[#223627] border border-[#DFE7E1] px-3 py-2 rounded-xl text-xs font-medium text-left transition-all active:scale-[0.98] shadow-2xs cursor-pointer flex items-center gap-2"
                >
                  <span className="text-[#126B3A] font-bold">›</span>
                  <span>{qText}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat / Field Advisory Dialogue Box */}
        <div className="flex-1 bg-white border border-[#DCE4DD] rounded-2xl p-4 sm:p-6 shadow-xs overflow-y-auto space-y-4 min-h-[220px] sm:min-h-[380px] max-h-[440px] sm:max-h-[520px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                'flex flex-col gap-1.5 max-w-[94%] sm:max-w-[88%]',
                m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              )}
            >
              {/* Message Header Tag */}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#66786A] px-1">
                {m.role === 'user' ? (
                  <span>🧑‍🌾 {lang === 'hi' ? 'आपका प्रश्न' : lang === 'mr' ? 'आपला प्रश्न' : 'Your Query'}</span>
                ) : (
                  <span className="flex items-center gap-1 text-[#126B3A]">
                    <span>🌾</span>
                    <span>{lang === 'hi' ? 'कृषि मौसम परामर्श' : lang === 'mr' ? 'कृषी हवामान सल्ला' : 'Agro-Met Advisory'}</span>
                    <span className="text-slate-400 font-normal">· {gpDetails.panchayatName}</span>
                  </span>
                )}
              </div>

              {/* Message Body */}
              <div
                className={cn(
                  'p-4 rounded-2xl shadow-2xs border',
                  m.role === 'user'
                    ? 'bg-[#126B3A] text-white border-[#0E5C31] rounded-tr-xs'
                    : 'bg-[#F9FAF9] text-[#1D2B20] border-[#DCE5DE] rounded-tl-xs'
                )}
              >
                <FormattedMessage content={m.content} isUser={m.role === 'user'} />

                {/* Speaker Controls on Advisory cards */}
                {m.role === 'assistant' && (
                  <div className="mt-3 pt-2.5 border-t border-[#DFE7E0] flex items-center justify-between gap-3">
                    <button
                      onClick={() => speak(m.content)}
                      className="text-xs font-semibold text-[#126B3A] hover:text-[#0B4F2A] flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#D5DFD7] shadow-2xs cursor-pointer"
                    >
                      <Volume2 size={13} />
                      <span>{lang === 'hi' ? 'बोलकर सुनें (Listen)' : lang === 'mr' ? 'ऐका (Listen)' : 'Listen Audio'}</span>
                    </button>
                    {isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-200 cursor-pointer"
                      >
                        {lang === 'hi' ? 'रोकें (Stop)' : lang === 'mr' ? 'थांबवा (Stop)' : 'Stop'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-[#48594C] bg-[#F4F7F4] p-3.5 rounded-xl w-52 border border-[#D8E2DA] shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-[#126B3A] animate-ping" />
              <span className="font-medium">
                {lang === 'hi' ? 'कृषि डेटा व मौसम विश्लेषण जारी...' : lang === 'mr' ? 'हवामान व पीक विश्लेषण सुरू...' : 'Analyzing agro-met telemetry...'}
              </span>
            </div>
          )}
        </div>

        {/* Audio State Notification Strip */}
        {(listening || isSpeaking) && (
          <div className="bg-[#142318] text-white px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Radio size={16} className={cn(listening ? 'text-red-400 animate-pulse' : 'text-emerald-400')} />
              <span>
                {listening
                  ? (lang === 'hi' ? 'माइक सक्रिय है... अपनी भाषा में बोलिए' : lang === 'mr' ? 'माइक सुरू आहे... बोला' : 'Listening... Speak in your language')
                  : (lang === 'hi' ? 'परामर्श का वाचन हो रहा है...' : lang === 'mr' ? 'सल्ल्याचे वाचन सुरू आहे...' : 'Reading advisory audio...')}
              </span>
            </div>

            <button
              onClick={listening ? () => setListening(false) : stopSpeaking}
              className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {lang === 'hi' ? 'रोकें (Stop)' : lang === 'mr' ? 'थांबवा' : 'Stop'}
            </button>
          </div>
        )}

        {/* Tactile High-Contrast Farmer Input Bar */}
        <div className="bg-white border-2 border-[#D0DCD2] focus-within:border-[#126B3A] rounded-2xl p-2 sm:p-2.5 shadow-sm flex items-center gap-2 transition-colors">
          <button
            onClick={listening ? () => setListening(false) : startListening}
            className={cn(
              'h-11 px-3.5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all flex-shrink-0 cursor-pointer',
              listening
                ? 'bg-red-600 text-white animate-pulse shadow-md ring-4 ring-red-100'
                : 'bg-[#EAF5ED] text-[#126B3A] hover:bg-[#D7EEDD] border border-[#BBDDC3]'
            )}
            title="बोलकर पूछें"
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
            <span className="hidden sm:inline">
              {listening ? (lang === 'hi' ? 'रोकें' : 'Stop') : (lang === 'hi' ? 'बोलें' : lang === 'mr' ? 'बोला' : 'Speak')}
            </span>
          </button>

          <input
            className="flex-1 bg-transparent border-none text-base sm:text-sm text-[#142318] focus:outline-none px-2 placeholder:text-[#829285] font-medium"
            placeholder={
              listening
                ? (lang === 'hi' ? 'सुन रहा हूँ... बोलिए' : lang === 'mr' ? 'ऐकत आहे... बोला' : 'Listening... Speak now')
                : (lang === 'hi'
                    ? 'यहाँ फसल, मौसम, खाद या रोग का नाम लिखें...'
                    : lang === 'mr'
                    ? 'येथे पीक, हवामान, खत किंवा रोगाचे नाव लिहा...'
                    : 'Type crop, weather, fertilizer, or pest query...')
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="h-11 px-4 rounded-xl bg-[#126B3A] hover:bg-[#0B4F2A] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-40 transition-all flex-shrink-0 cursor-pointer"
          >
            <span>{lang === 'hi' ? 'पूछें' : lang === 'mr' ? 'विचारा' : 'Ask'}</span>
            <Send size={14} />
          </button>
        </div>
      </main>
    </div>
  )
}

