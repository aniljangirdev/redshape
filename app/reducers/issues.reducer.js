import _ from 'lodash';
import { combineReducers } from 'redux';
import {
  ISSUES_GET_ALL,
  ISSUES_GET,
  ISSUES_COMMENT_SEND
} from '../actions/issues.actions';
import {
  TIME_GET_ALL
} from '../actions/tracking.actions';


const issuesGetAllReducer = (state = {
  data: [],
  fetchedOffset: 0,
  isFetching: false,
  error: undefined
}, action) => {
  switch (action.type) {
    case ISSUES_GET_ALL: {
      switch (action.status) {
        case 'START': {
          return { ...state, isFetching: true };
        }
        case 'OK': {
          return { ...state, isFetching: false, data: _.get(action.data, 'issues', []), error: undefined };
        }
        case 'NOK': {
          return { ...state, isFetching: false, error: action.data };
        }
        default:
          return state;
      }
    }
    default:
      return state;
  }
};

const selectedIssueReducer = (state = {
  data: {},
  isFetching: false,
  error: undefined,
  updates: {}
}, action) => {
  switch (action.type) {
    case ISSUES_GET: {
      switch (action.status) {
        case 'START': {
          return { ...state, isFetching: true };
        }
        case 'OK': {
          return { ...state, isFetching: false, data: _.get(action.data, 'issue', {}), error: undefined };
        }
        case 'NOK': {
          return { ...state, isFetching: false, error: action.data };
        }
        default:
          return state;
      }
    }
    case ISSUES_COMMENT_SEND: {
      switch (action.status) {
        case 'START': {
          return {
            ...state,
            updates: {
              ...state.updateStatus,
              [action.id]: {
                ok: false,
                isUpdating: true,
                error: undefined
              }
            }
          };
        }
        case 'OK': {
          return {
            ...state,
            data: {
              ...state.data,
              journals: [...state.data.journals, action.data]
            },
            updates: {
              ...state.updateStatus,
              [action.id]: {
                ok: true,
                isUpdating: false,
                error: undefined
              }
            }
          };
        }
        case 'NOK': {
          return {
            ...state,
            updates: {
              ...state.updateStatus,
              [action.id]: {
                ok: false,
                isUpdating: false,
                error: action.data
              }
            }
          };
        }
        default:
          return state;
      }
    }
    default:
      return state;
  }
};

const issueGetTimeSpent = (state = {
  data: [],
  isFetching: false,
  error: undefined
}, action) => {
  switch (action.type) {
    case TIME_GET_ALL: {
      switch (action.status) {
        case 'START': {
          return { ...state, isFetching: true };
        }
        case 'OK': {
          return { ...state, isFetching: false, data: _.get(action.data, 'time_entries', []), error: undefined };
        }
        case 'NOK': {
          return { ...state, isFetching: false, error: action.data };
        }
        default:
          return state;
      }
    }
    default:
      return state;
  }
};

export default combineReducers({
  assignedToMe: issuesGetAllReducer,
  current: selectedIssueReducer,
  time: issueGetTimeSpent
});
