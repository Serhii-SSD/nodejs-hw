import { Joi, Segments } from 'celebrate';

export const registerUserSchema = {
  [Segments.BODY]: Joi.object().keys({
    username: Joi.string().trim(),
    email: Joi.string().email().required().trim(),
    password: Joi.string().min(8).required(),
  }),
};


export const loginUserSchema = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().trim(),
    password: Joi.string().required(),
  }),
};
