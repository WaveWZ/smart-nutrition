import axios from 'axios'
import { API_BASE_URL } from '../config/app'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

export function createProfile(body) {
  return api.post('/profiles', body).then((response) => response.data)
}

export function getProfile(profileId) {
  return api.get(`/profiles/${profileId}`).then((response) => response.data)
}

export function updateProfile(profileId, body) {
  return api.patch(`/profiles/${profileId}`, body).then((response) => response.data)
}

export function getRecommendations(profileId, date) {
  return api
    .get(`/profiles/${profileId}/recommendations`, { params: { date } })
    .then((response) => response.data)
}

export function getIntakeHistory(profileId, end, days) {
  return api
    .get(`/profiles/${profileId}/intake/history`, { params: { end, days } })
    .then((response) => response.data)
}

export function getIntake(profileId, date) {
  return api
    .get(`/profiles/${profileId}/intake`, { params: { date } })
    .then((response) => response.data)
}

export function recordIntake(profileId, body) {
  return api.post(`/profiles/${profileId}/intake`, body).then((response) => response.data)
}

export function removeIntake(profileId, entryId, date) {
  return api
    .delete(`/profiles/${profileId}/intake/${entryId}`, { params: { date } })
    .then((response) => response.data)
}

export function searchFoods(params) {
  return api.get('/foods', { params }).then((response) => response.data)
}

export function createFood(body) {
  return api.post('/foods', body).then((response) => response.data)
}

export function readApiError(error) {
  if (!error?.response) {
    return 'The nutrition API is not reachable. Start the backend on port 4000.'
  }

  const body = error.response.data?.error
  if (body?.code === 'profile_not_found') {
    return 'This account does not have a nutrition profile yet.'
  }

  if (body?.code === 'profile_exists') {
    return 'A profile already exists for this account.'
  }

  if (Array.isArray(body?.details) && body.details.length > 0) {
    return body.details.join(' ')
  }

  return body?.message || 'The request could not be completed.'
}
