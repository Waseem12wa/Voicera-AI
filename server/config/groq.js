import Groq from 'groq-sdk'

const groq = new Groq({
	apiKey: process.env.GROQ_API_KEY || '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',
	dangerouslyAllowBrowser: false
})

export default groq
