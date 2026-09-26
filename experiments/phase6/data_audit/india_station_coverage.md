# India Station Coverage Report

## Investigation Method
An automated script scanned the global NOAA Integrated Surface Database (ISD) `isd-history.csv` to identify stations within India and specifically within the Maharashtra bounding box (Lat 15.6 - 22.0, Lon 72.6 - 80.9). 

## Station Counts
- **Total Global Stations in ISD**: ~30,000+
- **Total Indian Stations**: 543
- **Total Maharashtra Stations**: 84

## Representativeness Analysis
A review of the retrieved stations (e.g., USAF `430630` for Pune, `430030` for Mumbai) confirms that NOAA ISD heavily favors major urban centers, airports, and official synoptic IMD observatories.

- **Agricultural/Rural Coverage**: Extremely sparse.
- **Suitability for GramWeather**: This dataset is NOT perfectly representative of rural Panchayats. However, it is the highest quality, freely accessible, programmatic dataset of *real* weather observations available for India. 
- **Scientific Viability**: We can conduct a **limited scientifically defensible experiment** using these 84 Maharashtra synoptic stations to test the basic mechanics of downscaling and bias correction, provided we explicitly document the domain shift (Urban Synoptic vs Rural Agricultural).

## Result
**GATE PARTIAL**. We have enough stations for a pilot, but coverage is restricted to synoptic/airport locations.
