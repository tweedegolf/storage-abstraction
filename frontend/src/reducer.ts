import { DATA_RECEIVED } from './actions'

function label(state = {}, action) {
  switch (action.type) {
    case DATA_RECEIVED:
      state = {
        address: action.payload.address,
        label: action.payload.label,
      }
      return state
    default:
      return state
  }
}

export default label;