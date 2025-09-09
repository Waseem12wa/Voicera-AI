import fs from 'fs'
import path from 'path'
import { AIService } from './aiService.js'
import mammoth from 'mammoth'

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
					rawContent: content, // Store the raw content for quiz generation
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
		try {
			// For now, we'll use a more descriptive approach
			// In production, you would use a proper PDF parsing library
			const filePath = path.join('./uploads', fileName)
			
			// Check if file exists
			if (!fs.existsSync(filePath)) {
				return `PDF file ${fileName} not found in uploads directory.`
			}
			
			// Get file stats
			const stats = fs.statSync(filePath)
			const fileSize = (stats.size / 1024 / 1024).toFixed(2) // Size in MB
			
			// Return descriptive content based on file
			return `PDF Document: ${fileName}
File Size: ${fileSize} MB
Content Type: PDF Document
Description: This is a PDF document that contains educational or reference material. The document includes text, images, and formatted content that can be used for learning and teaching purposes.

Note: For full text extraction, a PDF parsing library would be needed. This document appears to be educational material suitable for creating quiz questions and learning activities.`
		} catch (error) {
			console.error('PDF extraction error:', error)
			return `PDF content from ${fileName} - Error accessing file: ${error.message}`
		}
	}
	
	static async extractPPTContent(fileName) {
		try {
			// For now, return a more descriptive placeholder
			// In production, you would use libraries like node-pptx or officegen
			return `PowerPoint presentation: ${fileName}. This file contains slides and presentation content. To extract actual text content, additional processing libraries are needed.`
		} catch (error) {
			console.error('PPT extraction error:', error)
			return `PowerPoint content from ${fileName} - Error extracting text: ${error.message}`
		}
	}
	
	static async extractDOCContent(fileName) {
		try {
			const filePath = path.join('./uploads', fileName)
			
			// Check if file exists
			if (!fs.existsSync(filePath)) {
				return `Word document ${fileName} not found in uploads directory.`
			}
			
			// Extract text from DOCX file using mammoth
			const result = await mammoth.extractRawText({ path: filePath })
			const text = result.value
			
			if (!text || text.trim().length < 10) {
				return `Word document: ${fileName}. The document appears to be empty or contains only images/formatting.`
			}
			
			console.log(`Extracted ${text.length} characters from ${fileName}`)
			return text
		} catch (error) {
			console.error('DOC extraction error:', error)
			return `Word document content from ${fileName} - Error extracting text: ${error.message}`
		}
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
