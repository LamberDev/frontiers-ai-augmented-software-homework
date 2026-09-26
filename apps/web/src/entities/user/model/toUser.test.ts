import { describe, expect, it } from 'vitest'
import { toUser } from './toUser'

describe('Given the toUser mapper', () => {
  describe('When mapping a RegisterUser API response DTO', () => {
    it('Then it maps the wire "userId" field to the domain "id" field, keeping the rest as-is', () => {
      // Arrange
      const dto = {
        userId: '11111111-1111-1111-1111-111111111111',
        userName: 'Grace Hopper',
        numberOfPublications: 12,
        university: {
          id: '22222222-2222-2222-2222-222222222222',
          frontiersOrganizationId: 42,
          name: 'MIT',
          score: 72,
        },
      }

      // Act
      const user = toUser(dto)

      // Assert
      expect(user).toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        userName: 'Grace Hopper',
        numberOfPublications: 12,
        university: dto.university,
      })
    })
  })
})
