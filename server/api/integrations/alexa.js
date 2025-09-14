import axios from 'axios'
import { ApiIntegration } from '../schema.js'

export class AlexaIntegration {
  constructor(integrationConfig) {
    this.config = integrationConfig
    this.skillId = this.config.skillId
    this.accessToken = this.config.accessToken
  }

  // Handle Alexa skill request
  async handleSkillRequest(request) {
    const { type, requestId, timestamp, locale } = request

    switch (type) {
      case 'LaunchRequest':
        return this.handleLaunchRequest(request)
      case 'IntentRequest':
        return this.handleIntentRequest(request)
      case 'SessionEndedRequest':
        return this.handleSessionEndedRequest(request)
      default:
        throw new Error(`Unknown request type: ${type}`)
    }
  }

  // Handle launch request
  async handleLaunchRequest(request) {
    return {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: 'Welcome to Voicera AI! You can ask me about your courses, quizzes, or grades. What would you like to know?'
        },
        shouldEndSession: false
      }
    }
  }

  // Handle intent request
  async handleIntentRequest(request) {
    const { intent } = request
    const intentName = intent.name

    switch (intentName) {
      case 'GetCourses':
        return await this.handleGetCoursesIntent(intent)
      case 'GetQuiz':
        return await this.handleGetQuizIntent(intent)
      case 'GetGrades':
        return await this.handleGetGradesIntent(intent)
      case 'GetSchedule':
        return await this.handleGetScheduleIntent(intent)
      case 'AMAZON.HelpIntent':
        return this.handleHelpIntent()
      case 'AMAZON.StopIntent':
      case 'AMAZON.CancelIntent':
        return this.handleStopIntent()
      default:
        return this.handleUnknownIntent()
    }
  }

  // Handle session ended request
  async handleSessionEndedRequest(request) {
    return {
      version: '1.0',
      response: {
        shouldEndSession: true
      }
    }
  }

  // Get courses intent
  async handleGetCoursesIntent(intent) {
    try {
      // In a real implementation, you would fetch actual course data
      const courses = [
        { name: 'Introduction to AI', progress: 75 },
        { name: 'Machine Learning Basics', progress: 50 },
        { name: 'Deep Learning', progress: 25 }
      ]

      const courseList = courses.map(course => 
        `${course.name} - ${course.progress}% complete`
      ).join(', ')

      return {
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: `Your courses are: ${courseList}`
          },
          shouldEndSession: false
        }
      }
    } catch (error) {
      return this.handleError('Failed to retrieve courses')
    }
  }

  // Get quiz intent
  async handleGetQuizIntent(intent) {
    try {
      const quizName = intent.slots?.quizName?.value || 'your quiz'
      
      // In a real implementation, you would fetch actual quiz data
      const quiz = {
        name: quizName,
        questions: 10,
        timeLimit: 30,
        dueDate: 'Tomorrow at 11:59 PM'
      }

      return {
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: `${quiz.name} has ${quiz.questions} questions with a ${quiz.timeLimit} minute time limit. It's due ${quiz.dueDate}.`
          },
          shouldEndSession: false
        }
      }
    } catch (error) {
      return this.handleError('Failed to retrieve quiz information')
    }
  }

  // Get grades intent
  async handleGetGradesIntent(intent) {
    try {
      // In a real implementation, you would fetch actual grade data
      const grades = [
        { course: 'Introduction to AI', grade: 'A', score: 92 },
        { course: 'Machine Learning Basics', grade: 'B+', score: 87 },
        { course: 'Deep Learning', grade: 'A-', score: 89 }
      ]

      const gradeList = grades.map(grade => 
        `${grade.course}: ${grade.grade} (${grade.score}%)`
      ).join(', ')

      return {
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: `Your grades are: ${gradeList}`
          },
          shouldEndSession: false
        }
      }
    } catch (error) {
      return this.handleError('Failed to retrieve grades')
    }
  }

  // Get schedule intent
  async handleGetScheduleIntent(intent) {
    try {
      // In a real implementation, you would fetch actual schedule data
      const schedule = [
        { time: '9:00 AM', event: 'AI Lecture', location: 'Room 101' },
        { time: '11:00 AM', event: 'ML Lab', location: 'Lab 205' },
        { time: '2:00 PM', event: 'Study Group', location: 'Library' }
      ]

      const scheduleList = schedule.map(item => 
        `${item.time}: ${item.event} in ${item.location}`
      ).join(', ')

      return {
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: `Your schedule for today is: ${scheduleList}`
          },
          shouldEndSession: false
        }
      }
    } catch (error) {
      return this.handleError('Failed to retrieve schedule')
    }
  }

  // Help intent
  handleHelpIntent() {
    return {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: 'You can ask me about your courses, quizzes, grades, or schedule. For example, say "What are my courses?" or "What are my grades?"'
        },
        shouldEndSession: false
      }
    }
  }

  // Stop intent
  handleStopIntent() {
    return {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: 'Goodbye! Have a great day studying!'
        },
        shouldEndSession: true
      }
    }
  }

  // Unknown intent
  handleUnknownIntent() {
    return {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: 'I\'m not sure I understand. You can ask me about your courses, quizzes, grades, or schedule. What would you like to know?'
        },
        shouldEndSession: false
      }
    }
  }

  // Error handler
  handleError(message) {
    return {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: `Sorry, ${message.toLowerCase()}. Please try again later.`
        },
        shouldEndSession: false
      }
    }
  }

  // Create Alexa skill manifest
  async createSkillManifest() {
    return {
      manifest: {
        publishingInformation: {
          locales: {
            'en-US': {
              name: 'Voicera AI',
              summary: 'Educational AI platform with voice commands',
              description: 'Access your courses, quizzes, grades, and schedule through voice commands with Voicera AI.',
              keywords: ['education', 'ai', 'courses', 'learning'],
              smallIconUri: 'https://voicera.ai/icons/small-icon.png',
              largeIconUri: 'https://voicera.ai/icons/large-icon.png'
            }
          },
          isAvailableWorldwide: true,
          testingInstructions: 'Test the skill by asking about courses, quizzes, grades, or schedule.',
          category: 'EDUCATION_AND_REFERENCE',
          distributionCountries: []
        },
        apis: {
          custom: {
            endpoint: {
              uri: `${this.config.baseUrl}/alexa/skill`
            },
            interfaces: []
          }
        },
        manifestVersion: '1.0'
      }
    }
  }

  // Create interaction model
  async createInteractionModel() {
    return {
      interactionModel: {
        languageModel: {
          invocationName: 'voicera ai',
          intents: [
            {
              name: 'GetCourses',
              slots: [],
              samples: [
                'what are my courses',
                'show me my courses',
                'list my courses',
                'what courses am I taking'
              ]
            },
            {
              name: 'GetQuiz',
              slots: [
                {
                  name: 'quizName',
                  type: 'AMAZON.SearchQuery'
                }
              ],
              samples: [
                'tell me about {quizName}',
                'what is {quizName}',
                'show me {quizName}',
                'quiz {quizName}'
              ]
            },
            {
              name: 'GetGrades',
              slots: [],
              samples: [
                'what are my grades',
                'show me my grades',
                'list my grades',
                'what are my scores'
              ]
            },
            {
              name: 'GetSchedule',
              slots: [],
              samples: [
                'what is my schedule',
                'show me my schedule',
                'what do I have today',
                'what are my classes'
              ]
            }
          ],
          types: []
        }
      }
    }
  }
}

// Alexa integration factory
export const createAlexaIntegration = async (integrationId) => {
  const integration = await ApiIntegration.findById(integrationId)
  if (!integration || integration.platform !== 'alexa') {
    throw new Error('Invalid Alexa integration')
  }

  return new AlexaIntegration(integration.configuration)
}

export default AlexaIntegration
