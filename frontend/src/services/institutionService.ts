import api from './apiClient'

export type InstitutionProfile = {
	name: string
	logoUrl?: string
	address: string
	institutionType: 'University' | 'College' | 'School' | 'Institute'
	contactEmail: string
	contactPhone: string
}

export const getMyInstitution = async () => {
	const { data } = await api.get<InstitutionProfile>('/institutions/me')
	return data
}

export const updateMyInstitution = async (payload: InstitutionProfile) => {
	const { data } = await api.put<InstitutionProfile>('/institutions/me', payload)
	return data
}


