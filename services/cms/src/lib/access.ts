import type { Access, FieldAccess } from 'payload'
export const owner: Access = ({req}) => req.user?.role === 'owner'
export const editor: Access = ({req}) => Boolean(req.user)
export const ownerField: FieldAccess = ({req}) => req.user?.role === 'owner'
export const publicContent: Access = ({req}) => req.user ? true : { _status:{equals:'published'} }
