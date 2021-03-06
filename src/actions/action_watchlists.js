import { askInstrument } from './action_instruments'
import { addLocalWatchlists, addLocalWatchlist, removeLocalWatchlist } from './action_local'
////////////WATCHLISTS
export const ADD_WATCHLISTS = 'ADD_WATCHLISTS'
export const ADD_MORE_WATCHLISTS = 'ADD_MORE_WATCHLISTS'
export const ADD_WATCHLIST  = 'ADD_WATCHLIST'
export const DELETE_WATCHLISTS = 'DELETE_WATCHLISTS'
export const REMOVE_FROM_WATCHLISTS = 'REMOVE_FROM_WATCHLISTS'
export const REMOVE_WATCHLIST = 'REMOVE_WATCHLIST'
export const ASKING_WATCHLISTS = 'ASKING_WATCHLISTS'
export const ASKING_WATCHLISTS_FAILED = 'ASKING_WATCHLISTS_FAILED'

export const askingWatchlistsFailed = (error) => ({
  type: ASKING_WATCHLISTS_FAILED,
  error
})

export const askingWatchlists = () => ({
  type: ASKING_WATCHLISTS
})

export const addWatchlists = watchlists => ({
  type: ADD_WATCHLISTS,
  watchlists
})

export const addMoreWatchlists = watchlists => ({
  type: ADD_MORE_WATCHLISTS,
  watchlists
})

export const addWatchlist = watchlist => ({
  type: ADD_WATCHLIST,
  watchlist
})

export const deleteWatchlists = () => ({
  type: DELETE_WATCHLISTS
})

export const askWatchlists = (...theArgs) => (dispatch, getState) => {
  let link = (theArgs.length === 0)? "https://api.robinhood.com/watchlists/Default/" : theArgs[0];
  dispatch(askingWatchlists());
  return fetch(link, {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Authorization': getState().tokenReducer.token
    })
  })
  .then(response => response.json())
  .then(jsonResult => {
    if(jsonResult.hasOwnProperty("results")){
      if(theArgs.length === 0){
        dispatch(addWatchlists(jsonResult.results));
        dispatch(addLocalWatchlists(jsonResult.results.map((instrument)=>{
          return instrument.instrument
        })));
        jsonResult.results.forEach((instrument)=>{
          if(!getState().instrumentsReducer.instruments[instrument.instrument]){
            dispatch(askInstrument(instrument.instrument));
          }
        });
      }
      else {
        console.log("more watchlists!")
        dispatch(addMoreWatchlists(jsonResult.results));
        if( !jsonResult.next ){
          dispatch(addLocalWatchlists([...getState().watchlistsReducer.watchlists, ...jsonResult.results].map((instrument)=>{
            return instrument.instrument
          })));
        }
        jsonResult.results.forEach((instrument)=>{
          if(!getState().instrumentsReducer.instruments[instrument.instrument]){
            dispatch(askInstrument(instrument.instrument));
          }
        });
      }

      if(jsonResult.next){
        dispatch(askWatchlists(jsonResult.next));
      }
    }
    else {
      dispatch(askingWatchlistsFailed("something not right"));
    }
  })
  .catch(function(reason) {
    console.log(reason);
    dispatch(askingWatchlistsFailed(reason));
  });
}

export const addToWatchlists = (instrumentSymbol) => (dispatch, getState) => {
  var form = new FormData();
  form.append('symbols', instrumentSymbol);

  return fetch(`https://api.robinhood.com/watchlists/Default/bulk_add/`, {
    method: 'POST',
    headers: new Headers({
      'Accept': 'application/json',
      'Authorization': getState().tokenReducer.token
    }),
    body: form
  })
  .then(response => response.json())
  .then(jsonResult => {
    if(jsonResult[0].created_at){
      dispatch(addWatchlist(jsonResult[0]));
      dispatch(addLocalWatchlist(jsonResult[0].instrument));
    }
  })
  .catch(function(reason) {
    console.log(reason);
  });
}

export const removeInstrumentInWatchlist = instrumentIndex => ({
  type: REMOVE_WATCHLIST,
  instrumentIndex
})

export const removeWatchlist = (instrumentId) => (dispatch, getState) => {
  let tempWatchlists = getState().watchlistsReducer.watchlists.slice(0);
  let instrument = `https://api.robinhood.com/instruments/${instrumentId}/`;
  let instrumentIndex = -1;

  for(let i=0; i<tempWatchlists.length; i++){
    if(tempWatchlists[i].instrument === instrument){
      instrumentIndex = i;
      break;
    }
  }
  if(instrumentIndex !== -1) {
    dispatch(removeInstrumentInWatchlist(instrumentIndex));
  }
}

export const removeFromWatchlists = (instrumentId) => (dispatch, getState) =>{
  return fetch(`https://api.robinhood.com/watchlists/Default/${instrumentId}`, {
    method: 'DELETE',
    headers: new Headers({
      'Accept': 'application/json',
      'Authorization': getState().tokenReducer.token
    })
  })
  .then(response => {
    dispatch(removeLocalWatchlist(instrumentId));
    dispatch(removeWatchlist(instrumentId));
  })
  .catch(function(reason) {
    console.log(reason);
  });
}
