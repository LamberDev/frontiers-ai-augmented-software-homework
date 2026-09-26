import { describe, expect, it } from 'vitest'
import { validateRegisterUser } from './validateRegisterUser'

describe('Given validateRegisterUser', () => {
  describe('When every field is valid', () => {
    it('Then it returns no field errors', () => {
      // Arrange
      const input = { userName: 'Grace Hopper', universityName: 'MIT', numberOfPublications: 5 }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors).toEqual({})
    })
  })

  describe('When userName is empty', () => {
    it('Then it returns a required error for userName', () => {
      // Arrange
      const input = { userName: '', universityName: 'MIT', numberOfPublications: 5 }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.userName).toEqual(['User name is required.'])
    })
  })

  describe('When userName is only whitespace', () => {
    it('Then it is trimmed and treated as required', () => {
      // Arrange
      const input = { userName: '   ', universityName: 'MIT', numberOfPublications: 5 }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.userName).toEqual(['User name is required.'])
    })
  })

  describe('When userName is longer than 100 characters', () => {
    it('Then it returns a too-long error for userName', () => {
      // Arrange
      const input = {
        userName: 'a'.repeat(101),
        universityName: 'MIT',
        numberOfPublications: 5,
      }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.userName).toEqual(['User name must be at most 100 characters.'])
    })
  })

  describe('When userName is exactly 100 characters (boundary)', () => {
    it('Then it is valid', () => {
      // Arrange
      const input = {
        userName: 'a'.repeat(100),
        universityName: 'MIT',
        numberOfPublications: 5,
      }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.userName).toBeUndefined()
    })
  })

  describe('When universityName is empty', () => {
    it('Then it returns a required error for universityName', () => {
      // Arrange
      const input = { userName: 'Grace Hopper', universityName: '   ', numberOfPublications: 5 }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.universityName).toEqual(['University name is required.'])
    })
  })

  describe('When numberOfPublications is null', () => {
    it('Then it returns a required error for numberOfPublications', () => {
      // Arrange
      const input = { userName: 'Grace Hopper', universityName: 'MIT', numberOfPublications: null }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.numberOfPublications).toEqual(['Number of publications is required.'])
    })
  })

  describe('When numberOfPublications is negative', () => {
    it('Then it returns a whole-number error for numberOfPublications', () => {
      // Arrange
      const input = { userName: 'Grace Hopper', universityName: 'MIT', numberOfPublications: -1 }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.numberOfPublications).toEqual([
        'Number of publications must be a whole number of at least 0.',
      ])
    })
  })

  describe('When numberOfPublications is not an integer', () => {
    it('Then it returns a whole-number error for numberOfPublications', () => {
      // Arrange
      const input = { userName: 'Grace Hopper', universityName: 'MIT', numberOfPublications: 1.5 }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.numberOfPublications).toEqual([
        'Number of publications must be a whole number of at least 0.',
      ])
    })
  })

  describe('When numberOfPublications is 0 (boundary)', () => {
    it('Then it is valid', () => {
      // Arrange
      const input = { userName: 'Grace Hopper', universityName: 'MIT', numberOfPublications: 0 }

      // Act
      const errors = validateRegisterUser(input)

      // Assert
      expect(errors.numberOfPublications).toBeUndefined()
    })
  })
})
