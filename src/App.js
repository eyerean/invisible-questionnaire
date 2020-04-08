import React from 'react';
import axios from 'axios';
import './App.css';

const axiosInstance = axios.create({
  baseURL: 'https://cors-anywhere.herokuapp.com/https://www.metaweather.com/api',
});

const initialState = {locations: []};

const reducer = (state, action) => {
  switch (action.type) {
    case 'add_city':
      return {locations: [...state.locations, action.payload]};
    case 'update_city':
      const foundCity = state.locations && state.locations.find(loc => loc.city === action.payload.city);
      if(foundCity){
        let newLocations = state.locations.concat();
        return {locations: newLocations.map(loc => loc.city === foundCity.city ? action.payload : loc)};
      } else {
        return state;
      }
    case 'clear_state':
      return initialState;
    default:
      throw new Error();
  }
}

const App = ()  => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [inputValue, setInputValue] = React.useState('');

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleButtonClick = () => {
    dispatch({type: 'clear_state'});
    const places = inputValue.split(',').map((word) => word.trim());
    places.forEach(place => {
      dispatch({type: 'add_city', payload: {city: place, temp: undefined, time: undefined, error: undefined }})
      handleFetchWoeid(place);
    })
  }
  
  const handleFetchWoeid = (city) => {
    axiosInstance.get(`/location/search/?query=${city}`)
      .then((response) => {
        if(response.data.length === 0){
            // no cities found
            dispatch({type: 'update_city', payload: {city, temp: undefined, time: undefined, error: 'No cities found with that name' }});
        } else if(response.data.length === 1){
        // one city found
        const id = response.data[0].woeid;
        if(id){
            axiosInstance.get(`/location/${id}`).then((res) => {
              const currTemp = res.data.consolidated_weather[0].the_temp;
              const currTime = res.data.time;
              dispatch({type: 'update_city', payload: {city, temp: Math.round(currTemp), time: currTime,  error: undefined }});
              }).catch((error) => {
                // weather info not found
                dispatch({type: 'update_city', payload: {city, temp: undefined, time: undefined, error: 'Weather info could not be fetched' }});
              })
            }
          }else {
            // more than one cities found
            dispatch({type: 'update_city', payload: {city, temp: undefined, time: undefined, error: 'More than one cities found with that name' }});
          }
        })
        .catch((error) => {
          // city not found
          dispatch({type: 'update_city', payload: {city, temp: undefined, time: undefined, error: 'Error fetching city' }});
    })
  }

  return (
    <div className="App">
      <p>Please separate the locations using a comma (,) character.</p>
      <input value={inputValue} onChange={handleChange} style={{width: 300, marginRight: 20}}/> 
      <button onClick={handleButtonClick}>go</button>

      {state.locations.length > 0 && state.locations.map((loc) =>
        <div key={loc.city} className="cities">
          <p>City: {loc.city}</p>
          <p>Current Temperature: {loc.error ? loc.error : loc.temp ? `${loc.temp} °C` : 'loading...'}</p>
          <p>Current Time: {loc.error ? '-' : loc.time ? `${loc.time}` : 'loading...'}</p>
          <hr />
        </div>
        )}
    </div>
  );
}

export default App;
