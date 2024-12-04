class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      data: this.data,
      message: this.message,
    });
  }
}

export { ApiResponse };
