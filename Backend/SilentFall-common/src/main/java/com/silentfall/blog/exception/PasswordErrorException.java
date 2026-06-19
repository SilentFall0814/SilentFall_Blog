package com.silentfall.blog.exception;

import com.silentfall.blog.constant.MessageConstant;

public class PasswordErrorException extends BaseException{
    public PasswordErrorException() {
    }
    public PasswordErrorException(String msg) {
        super(msg);
    }
}
