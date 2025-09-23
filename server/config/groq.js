import Groq from 'groq-sdk'

const groq = new Groq({
	apiKey: process.env.GROQ_API_KEY || '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',
	dangerouslyAllowBrowser: false
})

export default groq
