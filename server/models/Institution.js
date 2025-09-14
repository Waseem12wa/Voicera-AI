import mongoose from 'mongoose'

const institutionSchema = new mongoose.Schema({
	adminEmail: { type: String, index: true, unique: true },
	name: String,
	logoUrl: String,
	address: String,
	institutionType: { type: String, enum: ['University','College','School','Institute'] },
	contactEmail: String,
	contactPhone: String,
}, { timestamps: true })

export default mongoose.model('Institution', institutionSchema)
