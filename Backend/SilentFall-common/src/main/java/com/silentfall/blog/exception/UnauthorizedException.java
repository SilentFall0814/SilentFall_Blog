package com.silentfall.blog.exception;

import com.silentfall.blog.constant.MessageConstant;

public class UnauthorizedException extends TokenException{
    public UnauthorizedException() {
    }
    public UnauthorizedException(String msg) {
        super(msg);
    }
}
