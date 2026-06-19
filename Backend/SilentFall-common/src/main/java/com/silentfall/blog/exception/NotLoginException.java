package com.silentfall.blog.exception;

public class NotLoginException extends TokenException {

    public NotLoginException() {
    }

    public NotLoginException(String msg) {
        super(msg);
    }
}
