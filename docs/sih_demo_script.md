# GramWeather: SIH Live Demonstration Script

**Target Duration**: 3–5 minutes
**Target Audience**: Smart India Hackathon (SIH) Jury / Subject Matter Experts

---

## 1. The Problem (30 seconds)
*"Good morning. We are presenting GramWeather, a framework for rural Panchayat-level weather localization."*
*"A major issue with standard weather forecasts is that they provide a single average value for a massive 25km grid block. But in rural areas, especially hilly terrain, a Panchayat in a valley will experience significantly different temperatures than one on a ridge. Providing block-level averages to farmers can lead to incorrect agricultural decisions."*

## 2. Our Approach (30 seconds)
*"Instead of building complex, untested AI models, our approach is physically interpretable. We take the coarse reference forecast, automatically fetch the exact high-resolution elevation of the Panchayat, and apply a standard environmental lapse rate (0.0065°C/m) to adjust the temperature up or down based on the exact altitude difference."*

## 3. The Live Demo: Selection & Fetch (45 seconds)
*(On the screen, navigate the dropdowns)*
*"Let's see it in action. We'll select Maharashtra, Pune, Velhe block, and the Ambegaon Panchayat."*
*"When we hit 'Fetch', the system does three things instantly in the background:*
1. *It fetches the Open-Meteo reference forecast.*
2. *It hits a high-resolution SRTM topographic API to find the exact elevation of Ambegaon.*
3. *It computes the localized temperature."*

## 4. Traceability & Transparency (45 seconds)
*(Point to the dashboard)*
*"Here is the dashboard. Notice the clear distinction: on the left is the standard Reference Forecast. On the right, highlighted in blue, is our Experimental Localized Estimate."*
*"If we open the 'B2 Traceability' panel, the system shows exactly how it arrived at this number: it takes the reference temperature, calculates the exact elevation difference in meters between the grid and the village, multiplies it by the 0.0065 lapse rate, and outputs the final physical adjustment. There are no 'black box' AI models here—it is 100% traceable."*

## 5. Scientific Validation & Limitations (45 seconds)
*(Scroll down to Methodology/Validation)*
*"We did not just guess this would work. We evaluated multiple baselines against 1,660 real historical ground-truth observations across Maharashtra. We tested spatial interpolation, mean-bias correction, and even machine learning fallback models—and we rigorously rejected the ones that failed temporal holdout validation. We call this 'Baseline 2', and it was the strongest physically sound method, improving MAE from 1.705°C to 1.555°C in our experimental dataset."*

*"We are transparent about our limitations: this is an experimental downscaling technique. It works best in well-mixed atmospheric conditions, and it currently focuses on temperature, not precipitation."*

## 6. Fallback & Conclusion (30 seconds)
*"Finally, our architecture is robust. If the elevation API fails or the data is missing, the system gracefully falls back to the raw reference forecast and explicitly informs the user, rather than fabricating a number."*

*"GramWeather proves that before jumping to complex ML, we can use simple, physically interpretable, and scalable geographic data to provide better, highly-localized weather context for rural India. Thank you."*
