import fs from 'fs'
import path from 'path'
import { AIService } from './aiService.js'

export class FileProcessor {
	static async processFile(file, teacherEmail) {
		try {
			// Update file status to processing
			await this.updateFileStatus(file._id, 'processing')
			
			let content = ''
			let analysis = {}
			
			// Extract content based on file type
			switch (file.mimeType) {
				case 'application/pdf':
					content = await this.extractPDFContent(file.fileName)
					break
				case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
				case 'application/vnd.ms-powerpoint':
					content = await this.extractPPTContent(file.fileName)
					break
				case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
				case 'application/msword':
					content = await this.extractDOCContent(file.fileName)
					break
				case 'text/plain':
					content = await this.extractTextContent(file.fileName)
					break
				default:
					content = `File: ${file.originalName}`
			}
			
			// AI Analysis
			if (content) {
				analysis = await AIService.analyzeFileContent(
					content, 
					file.originalName, 
					file.mimeType
				)
			}
			
			// Auto-organize into sections based on content
			const section = this.determineSection(file.originalName, analysis.tags || [])
			
			// Update file with analysis results
			await this.updateFileWithAnalysis(file._id, {
				section,
				aiAnalysis: {
					...analysis,
					analyzedAt: new Date()
				},
				status: 'processed',
				title: this.generateTitle(file.originalName, analysis.summary),
				description: analysis.summary,
				topics: analysis.tags || []
			})
			
			return { success: true, analysis }
		} catch (error) {
			console.error('File processing error:', error)
			await this.updateFileStatus(file._id, 'failed')
			return { success: false, error: error.message }
		}
	}
	
	static async extractPDFContent(fileName) {
		// Placeholder for PDF extraction
		// In production, use libraries like pdf-parse or pdf2pic
		return `PDF content from ${fileName} - This is a placeholder for actual PDF text extraction.`
	}
	
	static async extractPPTContent(fileName) {
		// Placeholder for PowerPoint extraction
		// In production, use libraries like officegen or node-pptx
		return `PowerPoint content from ${fileName} - This is a placeholder for actual PPT text extraction.`
	}
	
	static async extractDOCContent(fileName) {
		// Placeholder for Word document extraction
		// In production, use libraries like mammoth or docx
		return `Word document content from ${fileName} - This is a placeholder for actual DOC text extraction.`
	}
	
	static async extractTextContent(fileName) {
		try {
			const filePath = path.join('./uploads', fileName)
			return fs.readFileSync(filePath, 'utf8')
		} catch (error) {
			return `Text content from ${fileName}`
		}
	}
	
	static determineSection(originalName, tags) {
		const name = originalName.toLowerCase()
		
		if (name.includes('assignment') || name.includes('homework') || name.includes('task')) {
			return 'assignments'
		}
		if (name.includes('quiz') || name.includes('test') || name.includes('exam')) {
			return 'quizzes'
		}
		if (name.includes('note') || name.includes('summary') || name.includes('review')) {
			return 'notes'
		}
		if (name.includes('resource') || name.includes('reference') || name.includes('material')) {
			return 'resources'
		}
		if (tags.some(tag => ['lecture', 'presentation', 'slide'].includes(tag.toLowerCase()))) {
			return 'lectures'
		}
		
		return 'lectures' // default
	}
	
	static generateTitle(originalName, summary) {
		if (summary && summary.length > 10) {
			return summary.substring(0, 50) + (summary.length > 50 ? '...' : '')
		}
		return originalName.replace(/\.[^/.]+$/, '') // remove extension
	}
	
	static async updateFileStatus(fileId, status) {
		const File = (await import('../models/File.js')).default
		await File.findByIdAndUpdate(fileId, { status })
	}
	
	static async updateFileWithAnalysis(fileId, updates) {
		const File = (await import('../models/File.js')).default
		await File.findByIdAndUpdate(fileId, updates)
	}
}
