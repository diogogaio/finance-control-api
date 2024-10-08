//Accepts only async functions!
const asyncErroHandler = (func: any) => {
  return (req: any, res: any, next: any) => {
    func(req, res, next).catch((err: any) => next(err));
  };
};
export default asyncErroHandler;
