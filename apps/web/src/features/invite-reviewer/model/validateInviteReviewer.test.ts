import { describe, expect, it } from 'vitest'
import { validateInviteReviewer } from './validateInviteReviewer'

describe('Given validateInviteReviewer', () => {
  describe('When userId is a valid lowercase UUID', () => {
    it('Then it returns no field errors', () => {
      // Arrange
      const input = { userId: '123e4567-e89b-12d3-a456-426614174000' }

      // Act
      const errors = validateInviteReviewer(input)

      // Assert
      expect(errors).toEqual({})
    })
  })

  describe('When userId is a valid uppercase UUID', () => {
    it('Then it is accepted case-insensitively', () => {
      // Arrange
      const input = { userId: '123E4567-E89B-12D3-A456-426614174000' }

      // Act
      const errors = validateInviteReviewer(input)

      // Assert
      expect(errors).toEqual({})
    })
  })

  describe('When userId is empty', () => {
    it('Then it returns a required error', () => {
      // Arrange
      const input = { userId: '' }

      // Act
      const errors = validateInviteReviewer(input)

      // Assert
      expect(errors.userId).toEqual(['User id is required.'])
    })
  })

  describe('When userId is only whitespace', () => {
    it('Then it is trimmed and treated as required', () => {
      // Arrange
      const input = { userId: '   ' }

      // Act
      const errors = validateInviteReviewer(input)

      // Assert
      expect(errors.userId).toEqual(['User id is required.'])
    })
  })

  describe('When userId is not a UUID', () => {
    it('Then it returns a UUID format error', () => {
      // Arrange
      const input = { userId: 'not-a-uuid' }

      // Act
      const errors = validateInviteReviewer(input)

      // Assert
      expect(errors.userId).toEqual(['User id must be a valid UUID.'])
    })
  })

  describe('When userId has the right length but wrong grouping', () => {
    it('Then it returns a UUID format error', () => {
      // Arrange
      const input = { userId: '123e4567e89b12d3a456426614174000' }

      // Act
      const errors = validateInviteReviewer(input)

      // Assert
      expect(errors.userId).toEqual(['User id must be a valid UUID.'])
    })
  })
})
